import { Node, Edge } from '@xyflow/react'
import { VMNodeData, SubnetNodeData, VNetNodeData } from '../types/nodes'

export type IssueSeverity = 'error' | 'warning' | 'ok'

export interface ValidationIssue {
  severity: IssueSeverity
  nodeId?: string
  nodeLabel?: string
  message: string
}

export interface ValidationResult {
  issues: ValidationIssue[]
  errorCount: number
  warningCount: number
}

// ── IP / CIDR utilities ───────────────────────────────────────────────────────

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split('.')
  if (parts.length !== 4) return null
  const nums = parts.map(Number)
  if (nums.some((n) => isNaN(n) || n < 0 || n > 255)) return null
  return (nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]
}

export function isValidIp(ip: string): boolean {
  return ipToInt(ip) !== null
}

export function isValidCidr(cidr: string): boolean {
  const [ip, prefix] = cidr.split('/')
  if (!ip || prefix === undefined) return false
  const bits = parseInt(prefix, 10)
  if (isNaN(bits) || bits < 0 || bits > 32) return false
  return isValidIp(ip)
}

export function ipInCidr(ip: string, cidr: string): boolean {
  const addr = ipToInt(ip)
  if (addr === null) return false
  const [network, prefix] = cidr.split('/')
  const netInt = ipToInt(network)
  if (netInt === null) return false
  const bits = parseInt(prefix, 10)
  if (isNaN(bits)) return false
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
  return (addr & mask) >>> 0 === (netInt & mask) >>> 0
}

export function cidrContainsCidr(outer: string, inner: string): boolean {
  const [innerNet, innerPrefix] = inner.split('/')
  const [, outerPrefix] = outer.split('/')
  if (parseInt(innerPrefix, 10) < parseInt(outerPrefix, 10)) return false
  // The network address of inner must be within outer
  return ipInCidr(innerNet, outer)
}

/** Azure reserves: .0 (network), .1 (gateway), .2-.3 (DNS), .255 (broadcast) */
function isAzureReservedIp(ip: string, cidr: string): boolean {
  const addr = ipToInt(ip)
  if (addr === null) return false
  const [network, prefix] = cidr.split('/')
  const netInt = ipToInt(network)
  if (netInt === null) return false
  const bits = parseInt(prefix, 10)
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
  const networkAddr = (netInt & mask) >>> 0
  const broadcast = (networkAddr | (~mask >>> 0)) >>> 0
  const reserved = new Set([networkAddr, networkAddr + 1, networkAddr + 2, networkAddr + 3, broadcast])
  return reserved.has((addr >>> 0))
}

export function validateNetwork(nodes: Node[], edges: Edge[]): ValidationResult {
  const issues: ValidationIssue[] = []

  const vmNodes = nodes.filter((n) => n.type === 'vm')
  const subnetNodes = nodes.filter((n) => n.type === 'subnet')
  const vnetNodes = nodes.filter((n) => n.type === 'vnet')

  const label = (n: Node) => (n.data as { label?: string }).label ?? n.id

  const connectedOf = (nodeId: string, type: string) =>
    edges
      .filter((e) => e.source === nodeId || e.target === nodeId)
      .map((e) => (e.source === nodeId ? e.target : e.source))
      .map((id) => nodes.find((n) => n.id === id))
      .filter((n): n is Node => n?.type === type)

  // ── 1. VNet validations ──────────────────────────────────────────────────────
  for (const vnet of vnetNodes) {
    const data = vnet.data as VNetNodeData
    if (!isValidCidr(data.addressSpace)) {
      issues.push({
        severity: 'error',
        nodeId: vnet.id,
        nodeLabel: label(vnet),
        message: `VNet "${label(vnet)}" has an invalid address space: "${data.addressSpace}"`,
      })
    }
  }

  // ── 2. Subnet validations ────────────────────────────────────────────────────
  for (const subnet of subnetNodes) {
    const data = subnet.data as SubnetNodeData

    if (!isValidCidr(data.addressPrefix)) {
      issues.push({
        severity: 'error',
        nodeId: subnet.id,
        nodeLabel: label(subnet),
        message: `Subnet "${label(subnet)}" has an invalid address prefix: "${data.addressPrefix}"`,
      })
      continue
    }

    const connectedVnets = connectedOf(subnet.id, 'vnet')
    if (connectedVnets.length === 0) {
      issues.push({
        severity: 'warning',
        nodeId: subnet.id,
        nodeLabel: label(subnet),
        message: `Subnet "${label(subnet)}" is not connected to any VNet`,
      })
    } else {
      for (const vnet of connectedVnets) {
        const vnetData = vnet.data as VNetNodeData
        if (isValidCidr(vnetData.addressSpace) && !cidrContainsCidr(vnetData.addressSpace, data.addressPrefix)) {
          issues.push({
            severity: 'error',
            nodeId: subnet.id,
            nodeLabel: label(subnet),
            message: `Subnet "${label(subnet)}" (${data.addressPrefix}) is outside VNet "${label(vnet)}" address space (${vnetData.addressSpace})`,
          })
        }
      }
    }
  }

  // ── 3. VM validations ────────────────────────────────────────────────────────
  const seenIps = new Map<string, string>() // ip → first VM label

  for (const vm of vmNodes) {
    const data = vm.data as VMNodeData
    const connectedSubnets = connectedOf(vm.id, 'subnet')

    if (connectedSubnets.length === 0) {
      issues.push({
        severity: 'warning',
        nodeId: vm.id,
        nodeLabel: label(vm),
        message: `VM "${label(vm)}" is not connected to any subnet`,
      })
    }

    const isDynamic = data.role !== 'domain-controller' && (data.ipAllocation ?? 'Dynamic') === 'Dynamic'

    if (isDynamic) {
      // Dynamic VMs get IP from DHCP — skip all static IP checks
      continue
    }

    if (!data.privateIp) {
      issues.push({
        severity: 'warning',
        nodeId: vm.id,
        nodeLabel: label(vm),
        message: `VM "${label(vm)}" is set to Static but has no private IP address assigned`,
      })
      continue
    }

    if (!isValidIp(data.privateIp)) {
      issues.push({
        severity: 'error',
        nodeId: vm.id,
        nodeLabel: label(vm),
        message: `VM "${label(vm)}" has an invalid IP address: "${data.privateIp}"`,
      })
      continue
    }

    if (seenIps.has(data.privateIp)) {
      issues.push({
        severity: 'error',
        nodeId: vm.id,
        nodeLabel: label(vm),
        message: `VM "${label(vm)}" shares IP "${data.privateIp}" with "${seenIps.get(data.privateIp)}"`,
      })
    } else {
      seenIps.set(data.privateIp, label(vm))
    }

    for (const subnet of connectedSubnets) {
      const subnetData = subnet.data as SubnetNodeData
      if (!isValidCidr(subnetData.addressPrefix)) continue

      if (!ipInCidr(data.privateIp, subnetData.addressPrefix)) {
        issues.push({
          severity: 'error',
          nodeId: vm.id,
          nodeLabel: label(vm),
          message: `VM "${label(vm)}" IP "${data.privateIp}" is outside subnet "${label(subnet)}" (${subnetData.addressPrefix})`,
        })
      } else if (isAzureReservedIp(data.privateIp, subnetData.addressPrefix)) {
        issues.push({
          severity: 'error',
          nodeId: vm.id,
          nodeLabel: label(vm),
          message: `VM "${label(vm)}" IP "${data.privateIp}" is an Azure-reserved address in subnet "${label(subnet)}"`,
        })
      }
    }
  }

  // ── 4. Summary ───────────────────────────────────────────────────────────────
  if (issues.length === 0) {
    issues.push({ severity: 'ok', message: 'All network configurations look good!' })
  }

  return {
    issues,
    errorCount: issues.filter((i) => i.severity === 'error').length,
    warningCount: issues.filter((i) => i.severity === 'warning').length,
  }
}
