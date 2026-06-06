import { Node, Edge } from '@xyflow/react'
import { VMNodeData, VNetNodeData, SubnetNodeData, NSGNodeData } from '../types/nodes'
import { validateNetwork, validateDeploymentReadiness, ValidationIssue } from './networkValidator'

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_')
}

// Azure reserves .0-.3 in each subnet; first usable host is .4
function getSubnetFirstHostIP(addressPrefix: string): string {
  const base = addressPrefix.split('/')[0]
  const parts = base.split('.')
  parts[3] = '4'
  return parts.join('.')
}

function getOsImageRef(osVersion: string) {
  switch (osVersion) {
    case 'windows-server-2022':
      return {
        publisher: 'MicrosoftWindowsServer',
        offer: 'WindowsServer',
        sku: '2022-datacenter-azure-edition',
      }
    case 'windows-server-2019':
      return {
        publisher: 'MicrosoftWindowsServer',
        offer: 'WindowsServer',
        sku: '2019-Datacenter',
      }
    case 'ubuntu-22-04':
      return {
        publisher: 'Canonical',
        offer: '0001-com-ubuntu-server-jammy',
        sku: '22_04-lts-gen2',
      }
    case 'ubuntu-20-04':
      return {
        publisher: 'Canonical',
        offer: '0001-com-ubuntu-server-focal',
        sku: '20_04-lts-gen2',
      }
    default:
      return {
        publisher: 'MicrosoftWindowsServer',
        offer: 'WindowsServer',
        sku: '2022-datacenter-azure-edition',
      }
  }
}

export function generateBicep(nodes: Node[], edges: Edge[]): string {
  const vnetNodes = nodes.filter((n) => n.type === 'vnet')
  const subnetNodes = nodes.filter((n) => n.type === 'subnet')
  const vmNodes = nodes.filter((n) => n.type === 'vm')
  const nsgNodes = nodes.filter((n) => n.type === 'nsg')

  // Build topology from edges (accept either direction for user convenience)
  const subnetToVnet = new Map<string, string>()
  const vmToSubnet = new Map<string, string>()
  const nsgToSubnet = new Map<string, string>()

  for (const edge of edges) {
    const src = nodes.find((n) => n.id === edge.source)
    const tgt = nodes.find((n) => n.id === edge.target)
    if (!src || !tgt) continue

    if (src.type === 'subnet' && tgt.type === 'vnet') subnetToVnet.set(src.id, tgt.id)
    if (src.type === 'vnet' && tgt.type === 'subnet') subnetToVnet.set(tgt.id, src.id)
    if (src.type === 'vm' && tgt.type === 'subnet') vmToSubnet.set(src.id, tgt.id)
    if (src.type === 'subnet' && tgt.type === 'vm') vmToSubnet.set(tgt.id, src.id)
    if (src.type === 'nsg' && tgt.type === 'subnet') nsgToSubnet.set(src.id, tgt.id)
    if (src.type === 'subnet' && tgt.type === 'nsg') nsgToSubnet.set(tgt.id, src.id)
  }

  // Track the ordered list of subnets per VNet to derive the correct ARM array index
  const vnetSubnetOrder = new Map<string, string[]>()
  for (const subnet of subnetNodes) {
    const vnetId = subnetToVnet.get(subnet.id)
    if (vnetId) {
      if (!vnetSubnetOrder.has(vnetId)) vnetSubnetOrder.set(vnetId, [])
      vnetSubnetOrder.get(vnetId)!.push(subnet.id)
    }
  }

  // ── Pre-flight validation ─────────────────────────────────────────────────
  // Run the same checks as the "Validate Network" button plus deployment-readiness
  // rules (VM naming, forbidden usernames, DC config). Issues are embedded as
  // comments in the generated file so reviewers see them immediately.
  const netResult = validateNetwork(nodes, edges)
  const deployIssues = validateDeploymentReadiness(nodes)
  const allIssues: ValidationIssue[] = [
    ...netResult.issues.filter((i) => i.severity !== 'ok'),
    ...deployIssues,
  ]
  const errorCount  = allIssues.filter((i) => i.severity === 'error').length
  const warnCount   = allIssues.filter((i) => i.severity === 'warning').length

  // Build a per-node issue map so individual resources get inline annotations
  const nodeIssues = new Map<string, string[]>()
  for (const issue of allIssues) {
    if (issue.nodeId) {
      if (!nodeIssues.has(issue.nodeId)) nodeIssues.set(issue.nodeId, [])
      nodeIssues.get(issue.nodeId)!.push(`// [${issue.severity.toUpperCase()}] ${issue.message}`)
    }
  }

  /** Emit any per-node annotation lines before a resource block. */
  function resourceAnnotations(nodeId: string): string {
    const lines = nodeIssues.get(nodeId)
    return lines ? lines.join('\n') + '\n' : ''
  }

  const parts: string[] = []

  // ── Header with validation summary ────────────────────────────────────────
  const validationBlock =
    allIssues.length === 0
      ? '// VALIDATION: All network and deployment checks passed \u2713'
      : [
          `// VALIDATION: ${errorCount} error(s), ${warnCount} warning(s) \u2014 review before deploying`,
          ...allIssues.map((i) => `//   [${i.severity.toUpperCase()}] ${i.message}`),
        ].join('\n')

  parts.push(`// ================================================================
// AZDesign \u2014 Generated Bicep Template
// Generated: ${new Date().toISOString()}
// Repository: https://github.com/jeevanbisht/AZDesign
//
${validationBlock}
// ================================================================

targetScope = 'resourceGroup'

@description('Azure region for all resources')
param location string = resourceGroup().location

@minLength(1)
@maxLength(20)
@description('Admin username for all VMs. Forbidden values: admin, administrator, root, guest, user, test.')
param adminUsername string = 'labadmin'

@secure()
@minLength(12)
@description('Admin password. Must satisfy Azure complexity: uppercase + lowercase + digit + special character.')
param adminPassword string
`)

  // ── NSGs ──────────────────────────────────────────────────────────────────
  for (const nsg of nsgNodes) {
    const d = nsg.data as NSGNodeData
    parts.push(`// NSG: ${d.label}
resource nsg_${sanitize(d.nsgName)} 'Microsoft.Network/networkSecurityGroups@2023-04-01' = {
  name: '${d.nsgName}'
  location: location
  properties: {
    securityRules: []
  }
}
`)
  }

  // ── Virtual Networks (with inline subnets) ────────────────────────────────
  for (const vnet of vnetNodes) {
    const d = vnet.data as VNetNodeData
    const attached = subnetNodes.filter((s) => subnetToVnet.get(s.id) === vnet.id)

    const subnetBlocks = attached
      .map((s) => {
        const sd = s.data as SubnetNodeData
        const nsgEntry = [...nsgToSubnet.entries()].find(([, sid]) => sid === s.id)
        const nsgNode = nsgEntry ? nsgNodes.find((n) => n.id === nsgEntry[0]) : null
        const nsgLine = nsgNode
          ? `\n          networkSecurityGroup: { id: nsg_${sanitize((nsgNode.data as NSGNodeData).nsgName)}.id }`
          : ''
        return `      {
        name: '${sd.subnetName}'
        properties: {
          addressPrefix: '${sd.addressPrefix}'${nsgLine}
        }
      }`
      })
      .join('\n')

    const subnetsSection =
      attached.length > 0
        ? `    subnets: [\n${subnetBlocks}\n    ]\n`
        : ''

    parts.push(`// Virtual Network: ${d.label}
resource vnet_${sanitize(d.vnetName)} 'Microsoft.Network/virtualNetworks@2023-04-01' = {
  name: '${d.vnetName}'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: ['${d.addressSpace}']
    }
${subnetsSection}  }
}
`)
  }

  // ── VMs (PIP → NIC → VM) ──────────────────────────────────────────────────
  const dcNode = vmNodes.find((v) => (v.data as VMNodeData).role === 'domain-controller')
  const dcData = dcNode ? (dcNode.data as VMNodeData) : null
  const dcSubnetNode = dcNode ? subnetNodes.find((s) => s.id === vmToSubnet.get(dcNode.id)) : null

  // Prefer the user-configured static IP; fall back to subnet's first usable host
  const dcStaticIP = dcData?.privateIp
    ?? (dcSubnetNode
        ? getSubnetFirstHostIP((dcSubnetNode.data as SubnetNodeData).addressPrefix)
        : '10.0.1.4')

  for (const vm of vmNodes) {
    const d = vm.data as VMNodeData
    const subnetNode = subnetNodes.find((s) => s.id === vmToSubnet.get(vm.id))
    const vnetNode = subnetNode
      ? vnetNodes.find((v) => v.id === subnetToVnet.get(subnetNode.id))
      : null

    // Use the correct subnet index within the VNet's inline subnets array
    const subnetRef = (() => {
      if (!subnetNode || !vnetNode) return `'<TODO: subnet not connected \u2014 draw an edge from this VM to a subnet>'`
      const vnetData = vnetNode.data as VNetNodeData
      const orderedSubnets = vnetSubnetOrder.get(vnetNode.id) ?? []
      const idx = orderedSubnets.indexOf(subnetNode.id)
      return `vnet_${sanitize(vnetData.vnetName)}.properties.subnets[${idx === -1 ? 0 : idx}].id`
    })()

    const img = getOsImageRef(d.osVersion)
    const hasDisk = d.role === 'domain-controller'

    const isDC = d.role === 'domain-controller'
    const isMember = d.role === 'member-server'
    const nicDnsBlock = isMember && dcStaticIP
      ? `    dnsSettings: {\n      dnsServers: ['${dcStaticIP}']\n    }\n`
      : ''

    // Respect the user-configured IP allocation for all VM roles
    const isStaticAlloc = isDC || d.ipAllocation === 'Static'
    const privateIPMethod = isStaticAlloc ? 'Static' : 'Dynamic'
    // Include the static IP only when one is configured — omit for Dynamic NICs
    const privateIPLine = isStaticAlloc && d.privateIp
      ? `\n          privateIPAddress: '${d.privateIp}'`
      : isDC
        ? `\n          privateIPAddress: '${dcStaticIP}'`
        : ''

    // Member server NIC must wait for AD DS to be ready, not just the DC NIC
    const nicDependsOn = isMember && dcData
      ? `\n  dependsOn: [ext_${sanitize(dcData.vmName)}_WaitForAD]`
      : ''

    const annotations = resourceAnnotations(vm.id)

    parts.push(`// ── ${d.label} (${d.role}) ${'─'.repeat(Math.max(0, 42 - d.label.length - d.role.length))}
${annotations}resource pip_${sanitize(d.vmName)} 'Microsoft.Network/publicIPAddresses@2023-04-01' = {
  name: 'pip-${d.vmName}'
  location: location
  sku: { name: 'Standard' }
  properties: { publicIPAllocationMethod: 'Static' }
}

resource nic_${sanitize(d.vmName)} 'Microsoft.Network/networkInterfaces@2023-04-01' = {
  name: 'nic-${d.vmName}'
  location: location${nicDependsOn}
  properties: {
${nicDnsBlock}    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          privateIPAllocationMethod: '${privateIPMethod}'${privateIPLine}
          subnet: { id: ${subnetRef} }
          publicIPAddress: { id: pip_${sanitize(d.vmName)}.id }
        }
      }
    ]
  }
}

resource vm_${sanitize(d.vmName)} 'Microsoft.Compute/virtualMachines@2023-03-01' = {
  name: '${d.vmName}'
  location: location
  properties: {
    hardwareProfile: { vmSize: '${d.vmSize}' }
    osProfile: {
      computerName: '${d.vmName}'
      adminUsername: adminUsername
      adminPassword: adminPassword
    }
    storageProfile: {
      imageReference: {
        publisher: '${img.publisher}'
        offer: '${img.offer}'
        sku: '${img.sku}'
        version: 'latest'
      }
      osDisk: {
        createOption: 'FromImage'
        managedDisk: { storageAccountType: 'Premium_LRS' }
      }${
        hasDisk
          ? `
      dataDisks: [
        {
          lun: 0
          diskSizeGB: 32
          createOption: 'Empty'
          managedDisk: { storageAccountType: 'Premium_LRS' }
        }
      ]`
          : ''
      }
    }
    networkProfile: {
      networkInterfaces: [{ id: nic_${sanitize(d.vmName)}.id }]
    }
  }
}
`)
  }

  // ── VM Extensions ─────────────────────────────────────────────────────────
  for (const vm of vmNodes) {
    const d = vm.data as VMNodeData

    if (d.role === 'domain-controller' && d.domainName) {
      parts.push(`// Active Directory DS — DSC Extension for ${d.vmName}
resource ext_${sanitize(d.vmName)}_DSC 'Microsoft.Compute/virtualMachines/extensions@2023-03-01' = {
  parent: vm_${sanitize(d.vmName)}
  name: 'DSC-ADDS'
  location: location
  properties: {
    publisher: 'Microsoft.Powershell'
    type: 'DSC'
    typeHandlerVersion: '2.83'
    autoUpgradeMinorVersion: true
    settings: {
      modulesUrl: 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/application-workloads/active-directory/active-directory-new-domain/DSC/CreateADPDC.zip'
      configurationFunction: 'CreateADPDC.ps1\\\\CreateADPDC'
      properties: {
        DomainName: '${d.domainName}'
        Admincreds: {
          UserName: adminUsername
          Password: 'PrivateSettingsRef:AdminPassword'
        }
      }
    }
    protectedSettings: {
      Items: { AdminPassword: adminPassword }
    }
  }
}

// Wait for AD DS to be fully initialised after the mandatory post-promotion reboot
// before any member server attempts to join. The DSC extension reports success when
// the script finishes, but AD services need extra time to start after reboot.
resource ext_${sanitize(d.vmName)}_WaitForAD 'Microsoft.Compute/virtualMachines/extensions@2023-03-01' = {
  parent: vm_${sanitize(d.vmName)}
  name: 'WaitForAD'
  location: location
  dependsOn: [ext_${sanitize(d.vmName)}_DSC]
  properties: {
    publisher: 'Microsoft.Compute'
    type: 'CustomScriptExtension'
    typeHandlerVersion: '1.10'
    autoUpgradeMinorVersion: true
    settings: {
      commandToExecute: 'powershell -Command "do { Start-Sleep 15 } until (Get-Service ADWS -ErrorAction SilentlyContinue | Where-Object Status -eq Running)"'
    }
  }
}
`)
    }

    if (d.role === 'member-server') {
      const domain = dcData?.domainName ?? d.domainToJoin ?? 'lab.local'
      const dep = dcData
        ? `\n  dependsOn: [ext_${sanitize(dcData.vmName)}_WaitForAD]`
        : ''
      parts.push(`// Domain Join Extension for ${d.vmName}
resource ext_${sanitize(d.vmName)}_DomainJoin 'Microsoft.Compute/virtualMachines/extensions@2023-03-01' = {
  parent: vm_${sanitize(d.vmName)}
  name: 'DomainJoin'
  location: location${dep}
  properties: {
    publisher: 'Microsoft.Compute'
    type: 'JsonADDomainExtension'
    typeHandlerVersion: '1.3'
    autoUpgradeMinorVersion: true
    settings: {
      Name: '${domain}'
      OUPath: ''
      User: '\${adminUsername}@${domain}'
      Restart: 'true'
      Options: '3'
    }
    protectedSettings: { Password: adminPassword }
  }
}
`)
    }

    if (d.role === 'web-server') {
      const isLinux = d.osVersion.startsWith('ubuntu')
      const stack = d.webStack ?? 'iis'

      if (isLinux) {
        const cmd =
          stack === 'nginx'
            ? 'apt-get update && apt-get install -y nginx && systemctl enable nginx && systemctl start nginx'
            : 'apt-get update && apt-get install -y apache2 && systemctl enable apache2 && systemctl start apache2'
        parts.push(`// Web Extension for ${d.vmName} (${stack} on Linux)
resource ext_${sanitize(d.vmName)}_Web 'Microsoft.Compute/virtualMachines/extensions@2023-03-01' = {
  parent: vm_${sanitize(d.vmName)}
  name: 'InstallWeb'
  location: location
  properties: {
    publisher: 'Microsoft.Azure.Extensions'
    type: 'CustomScript'
    typeHandlerVersion: '2.1'
    autoUpgradeMinorVersion: true
    settings: { commandToExecute: '${cmd}' }
  }
}
`)
      } else {
        parts.push(`// Web Extension for ${d.vmName} (IIS on Windows)
resource ext_${sanitize(d.vmName)}_Web 'Microsoft.Compute/virtualMachines/extensions@2023-03-01' = {
  parent: vm_${sanitize(d.vmName)}
  name: 'InstallIIS'
  location: location
  properties: {
    publisher: 'Microsoft.Compute'
    type: 'CustomScriptExtension'
    typeHandlerVersion: '1.10'
    autoUpgradeMinorVersion: true
    settings: {
      commandToExecute: 'powershell -ExecutionPolicy Unrestricted -Command "Install-WindowsFeature -Name Web-Server,Web-Mgmt-Tools -IncludeManagementTools"'
    }
  }
}
`)
      }
    }
  }

  return parts.join('\n')
}
