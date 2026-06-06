import { Handle, NodeProps, Position, Node, useReactFlow } from '@xyflow/react'
import { Shield, Server, Globe, Monitor, type LucideIcon } from 'lucide-react'
import { VMNodeData, VMRole } from '../../types/nodes'

type VMNodeType = Node<VMNodeData, 'vm'>

const ROLE_CONFIG: Record<
  VMRole,
  { headerBg: string; border: string; selectedBorder: string; Icon: LucideIcon; label: string }
> = {
  'domain-controller': {
    headerBg: '#1d4ed8',
    border: '#3b82f6',
    selectedBorder: '#93c5fd',
    Icon: Shield,
    label: 'Domain Controller',
  },
  'member-server': {
    headerBg: '#15803d',
    border: '#22c55e',
    selectedBorder: '#86efac',
    Icon: Server,
    label: 'Member Server',
  },
  'web-server': {
    headerBg: '#c2410c',
    border: '#f97316',
    selectedBorder: '#fdba74',
    Icon: Globe,
    label: 'Web Server',
  },
  generic: {
    headerBg: '#374151',
    border: '#6b7280',
    selectedBorder: '#d1d5db',
    Icon: Monitor,
    label: 'Generic VM',
  },
}

export function VMNode({ id, data, selected }: NodeProps<VMNodeType>) {
  const cfg = ROLE_CONFIG[data.role]
  const { Icon } = cfg
  const { deleteElements } = useReactFlow()

  return (
    <div
      style={{
        border: `2px solid ${selected ? cfg.selectedBorder : cfg.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        width: 200,
        boxShadow: selected
          ? `0 0 0 2px ${cfg.selectedBorder}33`
          : '0 4px 12px rgba(0,0,0,0.4)',
        background: '#1a1d27',
      }}
    >
      <div
        style={{
          background: cfg.headerBg,
          padding: '7px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}
      >
        <Icon size={14} className="text-white" />
        <span
          style={{
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}
        >
          {data.label}
        </span>
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

      <div style={{ padding: '8px 10px', fontSize: 11, lineHeight: '1.6' }}>
        <div style={{ color: '#94a3b8' }}>{cfg.label}</div>
        <div style={{ color: '#64748b', fontFamily: 'monospace' }}>{data.vmSize}</div>
        {data.role === 'domain-controller' && data.domainName && (
          <div style={{ color: '#60a5fa', marginTop: 2 }}>🌐 {data.domainName}</div>
        )}
        {data.role === 'member-server' && data.domainToJoin && (
          <div style={{ color: '#4ade80', marginTop: 2 }}>→ {data.domainToJoin}</div>
        )}
        {data.role === 'web-server' && data.webStack && (
          <div style={{ color: '#fb923c', marginTop: 2, textTransform: 'uppercase' }}>
            {data.webStack}
          </div>
        )}
        {data.privateIp && (
          <div style={{ color: '#a78bfa', marginTop: 2, fontFamily: 'monospace' }}>
            📡 {data.privateIp}
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
