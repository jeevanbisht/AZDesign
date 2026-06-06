import { Handle, NodeProps, Position, Node, NodeResizer, useReactFlow } from '@xyflow/react'
import { Network } from 'lucide-react'
import { VNetNodeData } from '../../types/nodes'

type VNetNodeType = Node<VNetNodeData, 'vnet'>

export function VNetNode({ id, data, selected }: NodeProps<VNetNodeType>) {
  const { deleteElements } = useReactFlow()

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, rgba(30,58,138,0.45) 0%, rgba(30,58,138,0.18) 100%)',
        border: `2px solid ${selected ? '#60a5fa' : '#1d4ed8'}`,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 10,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={300}
        minHeight={44}
        lineStyle={{ borderColor: '#60a5fa' }}
        handleStyle={{ borderColor: '#60a5fa', background: '#1e3a8a' }}
      />

      {/* Left accent stripe */}
      <div
        style={{
          width: 4,
          height: '60%',
          background: 'linear-gradient(180deg, #60a5fa, #1d4ed8)',
          borderRadius: 2,
          flexShrink: 0,
        }}
      />
      <Network size={15} color="#60a5fa" />
      <span style={{ color: '#93c5fd', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
        {data.vnetName}
      </span>
      <span style={{ color: '#3b82f6', fontSize: 11, fontFamily: 'monospace', marginLeft: 6, whiteSpace: 'nowrap' }}>
        {data.addressSpace}
      </span>
      <span style={{ marginLeft: 'auto', color: '#93c5fd', fontSize: 10, background: 'rgba(59,130,246,0.18)', padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>
        {data.location}
      </span>

      {selected && (
        <button
          onClick={(e) => { e.stopPropagation(); deleteElements({ nodes: [{ id }] }) }}
          title="Delete"
          style={{
            marginLeft: 8,
            background: 'rgba(239,68,68,0.2)',
            border: '1px solid #ef4444',
            borderRadius: 4,
            color: '#f87171',
            cursor: 'pointer',
            fontSize: 12,
            lineHeight: 1,
            padding: '2px 6px',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      )}

      <Handle type="target" position={Position.Top} />
    </div>
  )
}
