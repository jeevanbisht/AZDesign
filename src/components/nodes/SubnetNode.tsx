import { Handle, NodeProps, Position, Node, NodeResizer, useReactFlow } from '@xyflow/react'
import { Layers } from 'lucide-react'
import { SubnetNodeData } from '../../types/nodes'

type SubnetNodeType = Node<SubnetNodeData, 'subnet'>

export function SubnetNode({ id, data, selected }: NodeProps<SubnetNodeType>) {
  const { deleteElements } = useReactFlow()

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, rgba(76,29,149,0.4) 0%, rgba(76,29,149,0.15) 100%)',
        border: `1.5px solid ${selected ? '#a78bfa' : '#5b21b6'}`,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 10,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={36}
        lineStyle={{ borderColor: '#a78bfa' }}
        handleStyle={{ borderColor: '#a78bfa', background: '#3b0764' }}
      />

      {/* Left accent stripe */}
      <div
        style={{
          width: 3,
          height: '55%',
          background: 'linear-gradient(180deg, #a78bfa, #5b21b6)',
          borderRadius: 2,
          flexShrink: 0,
        }}
      />
      <Layers size={13} color="#a78bfa" />
      <span style={{ color: '#c4b5fd', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>
        {data.subnetName}
      </span>
      <span style={{ color: '#7c3aed', fontSize: 11, fontFamily: 'monospace', marginLeft: 6, whiteSpace: 'nowrap' }}>
        {data.addressPrefix}
      </span>

      {selected && (
        <button
          onClick={(e) => { e.stopPropagation(); deleteElements({ nodes: [{ id }] }) }}
          title="Delete"
          style={{
            marginLeft: 'auto',
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
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
