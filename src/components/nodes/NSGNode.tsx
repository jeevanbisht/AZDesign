import { Handle, NodeProps, Position, Node, useReactFlow } from '@xyflow/react'
import { ShieldAlert } from 'lucide-react'
import { NSGNodeData } from '../../types/nodes'

type NSGNodeType = Node<NSGNodeData, 'nsg'>

export function NSGNode({ id, data, selected }: NodeProps<NSGNodeType>) {
  const { deleteElements } = useReactFlow()

  return (
    <div
      style={{
        border: `2px solid ${selected ? '#fca5a5' : '#991b1b'}`,
        borderRadius: 10,
        overflow: 'hidden',
        width: 170,
        background: '#1a1d27',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      <div
        style={{
          background: '#7f1d1d',
          padding: '7px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}
      >
        <ShieldAlert size={14} color="#fca5a5" />
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, flex: 1 }}>{data.label}</span>
        {selected && (
          <button
            onClick={(e) => { e.stopPropagation(); deleteElements({ nodes: [{ id }] }) }}
            title="Delete"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 11,
              lineHeight: 1,
              padding: '1px 5px',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>
      <div style={{ padding: '7px 10px', fontSize: 11 }}>
        <div style={{ color: '#94a3b8' }}>Network Security Group</div>
        <div style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 10, marginTop: 2 }}>
          {data.nsgName}
        </div>
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
