import { useCallback, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  NodeTypes,
  EdgeTypes,
  Node,
  Connection,
} from '@xyflow/react'
import useLabStore from '../../store/useLabStore'
import { VMNode } from '../nodes/VMNode'
import { VNetNode } from '../nodes/VNetNode'
import { SubnetNode } from '../nodes/SubnetNode'
import { NSGNode } from '../nodes/NSGNode'
import { DeletableEdge } from '../edges/DeletableEdge'
import { createDefaultNodeData } from '../../types/nodes'

const nodeTypes: NodeTypes = {
  vm: VMNode,
  vnet: VNetNode,
  subnet: SubnetNode,
  nsg: NSGNode,
}

const edgeTypes: EdgeTypes = {
  straight: DeletableEdge,
  smoothstep: DeletableEdge,
  default: DeletableEdge,
}

// Only allow connections that reflect real Azure topology:
//   VM → Subnet, Subnet → VNet, NSG → Subnet
const VALID_CONNECTIONS: Record<string, string[]> = {
  vm:     ['subnet'],
  subnet: ['vnet'],
  nsg:    ['subnet'],
}

function isValidConnection(connection: Connection, nodes: Node[]): boolean {
  const src = nodes.find((n) => n.id === connection.source)
  const tgt = nodes.find((n) => n.id === connection.target)
  if (!src || !tgt || src.id === tgt.id) return false
  return VALID_CONNECTIONS[src.type ?? '']?.includes(tgt.type ?? '') ?? false
}

export function LabCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeId,
  } = useLabStore()

  const { screenToFlowPosition } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()

      const nodeType = e.dataTransfer.getData('application/reactflow-type')
      const nodeRole = e.dataTransfer.getData('application/reactflow-role')
      if (!nodeType) return

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const id = `${nodeType}-${Date.now()}`

      const style: React.CSSProperties = {}
      if (nodeType === 'vnet') {
        style.width = 900; style.height = 56
        position.x = position.x - 450
      }
      if (nodeType === 'subnet') {
        style.width = 860; style.height = 44
        position.x = position.x - 430
      }

      const newNode: Node = {
        id,
        type: nodeType,
        position,
        data: createDefaultNodeData(nodeType, nodeRole, id),
        style,
      }

      addNode(newNode)
      setSelectedNodeId(id)
    },
    [screenToFlowPosition, addNode, setSelectedNodeId],
  )

  return (
    <div ref={wrapperRef} style={{ flex: 1, position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={(connection) => isValidConnection(connection, nodes)}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_e, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        deleteKeyCode="Delete"
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#1e2130" />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'vnet') return '#1d4ed8'
            if (n.type === 'subnet') return '#5b21b6'
            if (n.type === 'vm') return '#374151'
            if (n.type === 'nsg') return '#991b1b'
            return '#374151'
          }}
          maskColor="rgba(15,17,23,0.7)"
        />
      </ReactFlow>

      {/* Drop hint when canvas is empty */}
      {nodes.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 48 }}>🔲</div>
          <div style={{ color: '#334155', fontSize: 14, fontWeight: 500 }}>
            Drag components from the palette to start designing your lab
          </div>
        </div>
      )}
    </div>
  )
}
