import { useRef, useState } from 'react'
import { Cpu, Download, Trash2, Copy, Check, X, Terminal, ExternalLink, Save, Upload } from 'lucide-react'
import useLabStore from '../../store/useLabStore'
import { generateBicep } from '../../engine/bicepGenerator'

function BicepModal({ content, onClose }: { content: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lab.bicep'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#12151e',
          border: '1px solid #2d3148',
          borderRadius: 12,
          width: '760px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #1e2130',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600, flex: 1 }}>
            📄 lab.bicep — Generated Template
          </span>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              background: '#1e2130',
              border: '1px solid #2d3148',
              borderRadius: 6,
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {copied ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              background: '#4f46e5',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Download size={13} />
            Download
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#475569',
              padding: '4px',
              borderRadius: 4,
              marginLeft: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Code content */}
        <pre
          style={{
            flex: 1,
            overflowY: 'auto',
            margin: 0,
            padding: '16px 20px',
            fontSize: 12,
            lineHeight: '1.7',
            color: '#94a3b8',
            fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
            background: '#0a0c14',
            whiteSpace: 'pre',
          }}
        >
          {content}
        </pre>
      </div>
    </div>
  )
}

const AZURE_LOCATIONS = [
  'eastus', 'eastus2', 'westus', 'westus2', 'westus3',
  'centralus', 'northcentralus', 'southcentralus',
  'northeurope', 'westeurope', 'uksouth', 'ukwest',
  'australiaeast', 'southeastasia', 'eastasia',
  'japaneast', 'japanwest', 'canadacentral', 'canadaeast',
]

function DeployModal({ bicep, onClose }: { bicep: string; onClose: () => void }) {
  const [rg, setRg] = useState('lab-rg')
  const [location, setLocation] = useState('eastus')
  const [copied, setCopied] = useState(false)

  const handleDownload = () => {
    const blob = new Blob([bicep], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lab.bicep'
    a.click()
    URL.revokeObjectURL(url)
  }

  const cliCommands = `# 1. Login (skip if already logged in)
az login

# 2. Create resource group
az group create --name ${rg} --location ${location}

# 3. Deploy the Bicep template
az deployment group create \\
  --resource-group ${rg} \\
  --template-file lab.bicep \\
  --verbose`

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(cliCommands)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputStyle = {
    background: '#0a0c14',
    border: '1px solid #2d3148',
    borderRadius: 6,
    color: '#e2e8f0',
    padding: '6px 10px',
    fontSize: 13,
    outline: 'none',
    flex: 1,
  }

  const labelStyle = { color: '#64748b', fontSize: 12, minWidth: 110 }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#12151e', border: '1px solid #2d3148', borderRadius: 12, width: 640, maxWidth: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.7)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e2130', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600, flex: 1 }}>☁️ Deploy to Azure</span>
          <a
            href="https://shell.azure.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#0078d4', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
          >
            <ExternalLink size={12} />
            Open Cloud Shell
          </a>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px', borderRadius: 4, marginLeft: 2 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* Step 1 – Configure */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1e2e' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Step 1 — Configure</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={labelStyle}>Resource Group</span>
                <input style={inputStyle} value={rg} onChange={(e) => setRg(e.target.value)} placeholder="lab-rg" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={labelStyle}>Location</span>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  {AZURE_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2 – Download */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1e2e' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Step 2 — Download Bicep Template</div>
            <button
              onClick={handleDownload}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px', background: 'linear-gradient(135deg, #4f46e5, #6d28d9)', border: 'none', borderRadius: 7, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              <Download size={14} />
              Download lab.bicep
            </button>
          </div>

          {/* Step 3 – CLI Commands */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.07em', flex: 1 }}>
                Step 3 — Run Azure CLI Commands
              </div>
              <button
                onClick={handleCopyCommands}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#1e2130', border: '1px solid #2d3148', borderRadius: 5, color: '#94a3b8', cursor: 'pointer', fontSize: 11 }}
              >
                {copied ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre
              style={{ margin: 0, padding: '14px 16px', background: '#0a0c14', borderRadius: 8, border: '1px solid #1e2130', fontSize: 12, lineHeight: '1.8', color: '#94a3b8', fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace", whiteSpace: 'pre', overflowX: 'auto' }}
            >
              {cliCommands}
            </pre>
            <p style={{ margin: '10px 0 0', fontSize: 11, color: '#475569' }}>
              💡 Tip: Download <strong style={{ color: '#64748b' }}>lab.bicep</strong>, upload it in Azure Cloud Shell, then run the commands above.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Toolbar() {
  const { nodes, edges, clearLab, importLab } = useLabStore()
  const [showBicep, setShowBicep] = useState(false)
  const [bicepContent, setBicepContent] = useState('')
  const [showDeploy, setShowDeploy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const content = generateBicep(nodes, edges)
    setBicepContent(content)
    setShowBicep(true)
  }

  const handleDeploy = () => {
    const content = generateBicep(nodes, edges)
    setBicepContent(content)
    setShowDeploy(true)
  }

  const handleClear = () => {
    if (confirm('Clear the canvas? All components will be removed.')) {
      clearLab()
    }
  }

  const handleSaveDiagram = () => {
    const diagram = { version: 1, nodes, edges }
    const blob = new Blob([JSON.stringify(diagram, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lab-design.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLoadDiagram = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (!parsed.nodes || !parsed.edges) throw new Error('Invalid diagram file')
        importLab(parsed.nodes, parsed.edges)
      } catch {
        alert('Failed to load diagram: invalid or corrupted file.')
      }
    }
    reader.readAsText(file)
    // Reset input so the same file can be re-loaded if needed
    e.target.value = ''
  }

  return (
    <>
      {/* Hidden file input for loading diagrams */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div
        style={{
          height: 50,
          background: '#0d0f18',
          borderBottom: '1px solid #1e2130',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Cpu size={15} color="#fff" />
          </div>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>
            Lab Designer
          </span>
          <span
            style={{
              fontSize: 10,
              color: '#4f46e5',
              background: '#1e1b4b',
              padding: '1px 7px',
              borderRadius: 10,
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            PREVIEW
          </span>
        </div>

        <div style={{ width: 1, height: 24, background: '#1e2130' }} />

        {/* Stats */}
        <div style={{ color: '#475569', fontSize: 12 }}>
          {nodes.filter((n) => n.type === 'vm').length} VMs ·{' '}
          {nodes.filter((n) => n.type === 'vnet').length} VNets ·{' '}
          {nodes.filter((n) => n.type === 'subnet').length} Subnets
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Actions */}
        <button
          onClick={handleLoadDiagram}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            background: 'transparent',
            border: '1px solid #2d3148',
            borderRadius: 7,
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.borderColor = '#4f46e5'
            b.style.color = '#818cf8'
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.borderColor = '#2d3148'
            b.style.color = '#64748b'
          }}
          title="Load a saved diagram from a .json file"
        >
          <Upload size={13} />
          Load Diagram
        </button>

        <button
          onClick={handleSaveDiagram}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            background: 'transparent',
            border: '1px solid #2d3148',
            borderRadius: 7,
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.borderColor = '#4f46e5'
            b.style.color = '#818cf8'
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.borderColor = '#2d3148'
            b.style.color = '#64748b'
          }}
          title="Save diagram to a .json file"
        >
          <Save size={13} />
          Save Diagram
        </button>

        <div style={{ width: 1, height: 24, background: '#1e2130' }} />

        <button
          onClick={handleClear}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            background: 'transparent',
            border: '1px solid #2d3148',
            borderRadius: 7,
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.borderColor = '#ef4444'
            b.style.color = '#ef4444'
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.borderColor = '#2d3148'
            b.style.color = '#64748b'
          }}
        >
          <Trash2 size={13} />
          Clear
        </button>

        <button
          onClick={handleExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '6px 16px',
            background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
            border: 'none',
            borderRadius: 7,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(79,70,229,0.35)',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(79,70,229,0.5)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(79,70,229,0.35)')
          }
        >
          <Download size={14} />
          Export Bicep
        </button>

        <button
          onClick={handleDeploy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '6px 16px',
            background: '#0078d4',
            border: 'none',
            borderRadius: 7,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,120,212,0.35)',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = '#106ebe')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = '#0078d4')
          }
        >
          <Terminal size={14} />
          Deploy to Azure
        </button>
      </div>

      {showBicep && (
        <BicepModal content={bicepContent} onClose={() => setShowBicep(false)} />
      )}
      {showDeploy && (
        <DeployModal bicep={bicepContent} onClose={() => setShowDeploy(false)} />
      )}
    </>
  )
}
