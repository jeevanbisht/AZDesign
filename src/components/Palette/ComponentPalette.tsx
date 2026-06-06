import useLabStore from '../../store/useLabStore'
import { Network, Layers, ShieldAlert, Shield, Server, Globe, Monitor, LucideIcon } from 'lucide-react'
import { createDefaultNodeData } from '../../types/nodes'

interface PaletteItemDef {
  nodeType: string
  role: string
  Icon: LucideIcon
  label: string
  desc: string
  color: string
}

const SECTIONS: { title: string; items: PaletteItemDef[] }[] = [
  {
    title: 'Network',
    items: [
      { nodeType: 'vnet', role: '', Icon: Network, label: 'Virtual Network', desc: 'Azure VNet · address space', color: '#60a5fa' },
      { nodeType: 'subnet', role: '', Icon: Layers, label: 'Subnet', desc: 'Subnet within a VNet', color: '#a78bfa' },
      { nodeType: 'nsg', role: '', Icon: ShieldAlert, label: 'NSG', desc: 'Network Security Group', color: '#f87171' },
    ],
  },
  {
    title: 'Virtual Machines',
    items: [
      { nodeType: 'vm', role: 'domain-controller', Icon: Shield, label: 'Domain Controller', desc: 'Active Directory + DNS', color: '#60a5fa' },
      { nodeType: 'vm', role: 'member-server', Icon: Server, label: 'Member Server', desc: 'Joins domain, general purpose', color: '#4ade80' },
      { nodeType: 'vm', role: 'web-server', Icon: Globe, label: 'Web Server', desc: 'IIS / Nginx / Apache', color: '#fb923c' },
      { nodeType: 'vm', role: 'generic', Icon: Monitor, label: 'Generic VM', desc: 'Bare Windows or Linux VM', color: '#94a3b8' },
    ],
  },
]

function PaletteItem({ item, onTap }: { item: PaletteItemDef; onTap?: () => void }) {
  const { Icon } = item
  const { addNode } = useLabStore()

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/reactflow-type', item.nodeType)
    e.dataTransfer.setData('application/reactflow-role', item.role)
    e.dataTransfer.effectAllowed = 'move'
  }

  // On mobile, tapping a palette item adds the node at the centre of the canvas
  const handleTap = () => {
    const id = `${item.nodeType}-${Date.now()}`
    const data = createDefaultNodeData(item.nodeType, item.role, id)
    addNode({ id, type: item.nodeType, position: { x: 300, y: 200 }, data })
    onTap?.()
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={handleTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 8,
        cursor: 'grab',
        userSelect: 'none',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#2d3148')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${item.color}18`,
          border: `1px solid ${item.color}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={item.color} />
      </div>
      <div>
        <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{item.label}</div>
        <div style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>{item.desc}</div>
      </div>
    </div>
  )
}

export function ComponentPalette({ onItemTap }: { onItemTap?: () => void } = {}) {
  return (
    <div
      style={{
        width: 240,
        height: '100%',
        flexShrink: 0,
        background: '#12151e',
        borderRight: '1px solid #1e2130',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Title */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #1e2130' }}>
        <div style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Components
        </div>
        <div style={{ color: '#475569', fontSize: 11, marginTop: 3 }}>
          Drag onto the canvas
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <div key={section.title} style={{ padding: '10px 4px' }}>
          <div style={{ color: '#475569', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px 6px' }}>
            {section.title}
          </div>
          {section.items.map((item) => (
            <PaletteItem key={`${item.nodeType}-${item.role}`} item={item} onTap={onItemTap} />
          ))}
        </div>
      ))}

      {/* Footer hint */}
      <div style={{ marginTop: 'auto', padding: 14, borderTop: '1px solid #1e2130' }}>
        <div style={{ color: '#334155', fontSize: 10, lineHeight: '1.5' }}>
          Connect nodes by dragging from a handle (●) to another node. Select a node to configure its properties.
        </div>
      </div>
    </div>
  )
}
