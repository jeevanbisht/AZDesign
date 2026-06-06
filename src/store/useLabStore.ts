import { create } from 'zustand'
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react'
import { VMNodeData, SubnetNodeData, VNetNodeData } from '../types/nodes'

const INITIAL_NODES: Node[] = [
  // Infrastructure bars rendered first so VMs appear above them (React Flow renders in array order)
  {
    id: 'vnet-1',
    type: 'vnet',
    position: { x: 60, y: 560 },
    data: {
      label: 'Lab VNet',
      vnetName: 'vnet-lab',
      addressSpace: '10.0.0.0/16',
      location: 'eastus',
    } satisfies VNetNodeData,
    style: { width: 820, height: 56 },
  },
  {
    id: 'subnet-1',
    type: 'subnet',
    position: { x: 60, y: 490 },
    data: {
      label: 'Default Subnet',
      subnetName: 'subnet-default',
      addressPrefix: '10.0.1.0/24',
    } satisfies SubnetNodeData,
    style: { width: 410, height: 44 },
  },

  {
    id: 'vm-dc-1',
    type: 'vm',
    position: { x: 100, y: 320 },
    data: {
      label: 'DC01',
      role: 'domain-controller',
      vmName: 'DC01',
      vmSize: 'Standard_D2s_v3',
      osVersion: 'windows-server-2022',
      adminUsername: 'labadmin',
      adminPassword: '',
      domainName: 'lab.local',
      netBIOSName: 'LAB',
      safeModePassword: '',
    } satisfies VMNodeData,
  },
  {
    id: 'vm-member-1',
    type: 'vm',
    position: { x: 360, y: 320 },
    data: {
      label: 'MemberServer01',
      role: 'member-server',
      vmName: 'MemberServer01',
      vmSize: 'Standard_B2s',
      osVersion: 'windows-server-2022',
      adminUsername: 'labadmin',
      adminPassword: '',
      domainToJoin: 'lab.local',
    } satisfies VMNodeData,
  },
]

const INITIAL_EDGES: Edge[] = [
  {
    id: 'e-dc-subnet',
    source: 'vm-dc-1',
    target: 'subnet-1',
    type: 'smoothstep',
    style: { stroke: '#6366f1', strokeWidth: 1.5 },
  },
  {
    id: 'e-member-subnet',
    source: 'vm-member-1',
    target: 'subnet-1',
    type: 'smoothstep',
    style: { stroke: '#6366f1', strokeWidth: 1.5 },
  },
  {
    id: 'e-subnet-vnet',
    source: 'subnet-1',
    target: 'vnet-1',
    type: 'smoothstep',
    style: { stroke: '#6366f1', strokeWidth: 1.5 },
  },
]

interface LabState {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null

  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect

  addNode: (node: Node) => void
  updateNodeData: (id: string, patch: Record<string, unknown>) => void
  setSelectedNodeId: (id: string | null) => void
  clearLab: () => void
  importLab: (nodes: Node[], edges: Edge[]) => void
}

const useLabStore = create<LabState>((set) => ({
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,
  selectedNodeId: null,

  onNodesChange: (changes) =>
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),

  onEdgesChange: (changes) =>
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

  onConnect: (connection) =>
    set((s) => ({
      edges: addEdge(
        { ...connection, type: 'smoothstep', style: { stroke: '#6366f1', strokeWidth: 1.5 } },
        s.edges,
      ),
    })),

  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),

  updateNodeData: (id, patch) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
      ),
    })),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  clearLab: () => set({ nodes: [], edges: [], selectedNodeId: null }),

  importLab: (nodes, edges) => set({ nodes, edges, selectedNodeId: null }),
}))

export default useLabStore
