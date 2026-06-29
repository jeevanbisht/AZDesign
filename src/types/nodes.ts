export type VMRole = 'domain-controller' | 'member-server' | 'web-server' | 'client-os' | 'generic'
export type WebStack = 'iis' | 'nginx' | 'apache'
export type OSVersion =
  | 'windows-11'
  | 'windows-server-2022'
  | 'windows-server-2019'
  | 'ubuntu-22-04'
  | 'ubuntu-20-04'
export type VMSize =
  | 'Standard_B2s'
  | 'Standard_B4ms'
  | 'Standard_D2s_v3'
  | 'Standard_D4s_v3'
  | 'Standard_D8s_v3'

export interface VMNodeData extends Record<string, unknown> {
  label: string
  role: VMRole
  vmName: string
  vmSize: VMSize
  osVersion: OSVersion
  adminUsername: string
  adminPassword: string
  privateIp?: string
  ipAllocation?: 'Dynamic' | 'Static'
  // Domain Controller
  domainName?: string
  netBIOSName?: string
  safeModePassword?: string
  // Member Server
  domainToJoin?: string
  // Web Server
  webStack?: WebStack
}

export interface VNetNodeData extends Record<string, unknown> {
  label: string
  vnetName: string
  addressSpace: string
  location: string
}

export interface SubnetNodeData extends Record<string, unknown> {
  label: string
  subnetName: string
  addressPrefix: string
}

export interface NSGNodeData extends Record<string, unknown> {
  label: string
  nsgName: string
}

export type LabNodeData = VMNodeData | VNetNodeData | SubnetNodeData | NSGNodeData

export function createDefaultNodeData(
  nodeType: string,
  role: string,
  _id: string,
): LabNodeData {
  const suffix = String(Math.floor(Math.random() * 900 + 100))

  switch (nodeType) {
    case 'vm':
      return createDefaultVMData(role as VMRole, suffix)
    case 'vnet':
      return {
        label: `VNet-${suffix}`,
        vnetName: `vnet-lab-${suffix}`,
        addressSpace: '10.0.0.0/16',
        location: 'eastus',
      } satisfies VNetNodeData
    case 'subnet':
      return {
        label: `Subnet-${suffix}`,
        subnetName: `subnet-${suffix}`,
        addressPrefix: '10.0.1.0/24',
      } satisfies SubnetNodeData
    case 'nsg':
      return {
        label: `NSG-${suffix}`,
        nsgName: `nsg-lab-${suffix}`,
      } satisfies NSGNodeData
    default:
      throw new Error(`Unknown node type: ${nodeType}`)
  }
}

function createDefaultVMData(role: VMRole, suffix: string): VMNodeData {
  const base: VMNodeData = {
    label: '',
    role,
    vmName: '',
    vmSize: 'Standard_B2s',
    osVersion: 'windows-server-2022',
    adminUsername: 'labadmin',
    adminPassword: '',
  }

  switch (role) {
    case 'domain-controller':
      return {
        ...base,
        label: `DC-${suffix}`,
        vmName: `DC${suffix}`,
        vmSize: 'Standard_D2s_v3',
        domainName: 'lab.local',
        netBIOSName: 'LAB',
        safeModePassword: '',
      }
    case 'member-server':
      return {
        ...base,
        label: `Member-${suffix}`,
        vmName: `MemberServer${suffix}`,
        domainToJoin: 'lab.local',
      }
    case 'web-server':
      return {
        ...base,
        label: `WebServer-${suffix}`,
        vmName: `WebServer${suffix}`,
        webStack: 'iis',
      }
    case 'client-os':
      return {
        ...base,
        label: `Client-${suffix}`,
        vmName: `Client${suffix}`,
        osVersion: 'windows-11',
      }
    case 'generic':
    default:
      return {
        ...base,
        label: `VM-${suffix}`,
        vmName: `VM${suffix}`,
      }
  }
}
