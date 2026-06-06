import React from 'react'
import { X } from 'lucide-react'
import useLabStore from '../../store/useLabStore'
import {
  VMNodeData,
  VNetNodeData,
  SubnetNodeData,
  NSGNodeData,
  VMRole,
  VMSize,
  OSVersion,
  WebStack,
} from '../../types/nodes'

// ── Shared form primitives ────────────────────────────────────────────────────

function SectionHeading({ title }: { title: string }) {
  return (
    <div
      style={{
        color: '#64748b',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '10px 0 4px',
        borderBottom: '1px solid #1e2130',
        marginBottom: 8,
      }}
    >
      {title}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '5px 9px',
  background: '#0f1117',
  border: '1px solid #2d3148',
  borderRadius: 6,
  color: '#e2e8f0',
  fontSize: 12,
  outline: 'none',
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
      onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#6366f1')}
      onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#2d3148')}
    />
  )
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      style={{ ...inputStyle, cursor: 'pointer' }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ── Per-type forms ────────────────────────────────────────────────────────────

const VM_SIZE_OPTIONS: { value: VMSize; label: string }[] = [
  { value: 'Standard_B2s', label: 'Standard_B2s (2 vCPU, 4 GB)' },
  { value: 'Standard_B4ms', label: 'Standard_B4ms (4 vCPU, 16 GB)' },
  { value: 'Standard_D2s_v3', label: 'Standard_D2s_v3 (2 vCPU, 8 GB)' },
  { value: 'Standard_D4s_v3', label: 'Standard_D4s_v3 (4 vCPU, 16 GB)' },
  { value: 'Standard_D8s_v3', label: 'Standard_D8s_v3 (8 vCPU, 32 GB)' },
]

const OS_OPTIONS: { value: OSVersion; label: string }[] = [
  { value: 'windows-server-2022', label: 'Windows Server 2022' },
  { value: 'windows-server-2019', label: 'Windows Server 2019' },
  { value: 'ubuntu-22-04', label: 'Ubuntu 22.04 LTS' },
  { value: 'ubuntu-20-04', label: 'Ubuntu 20.04 LTS' },
]

const WEB_STACK_OPTIONS: { value: WebStack; label: string }[] = [
  { value: 'iis', label: 'IIS (Windows)' },
  { value: 'nginx', label: 'Nginx (Linux)' },
  { value: 'apache', label: 'Apache (Linux)' },
]

const ROLE_OPTIONS: { value: VMRole; label: string }[] = [
  { value: 'domain-controller', label: 'Domain Controller' },
  { value: 'member-server', label: 'Member Server' },
  { value: 'web-server', label: 'Web Server' },
  { value: 'generic', label: 'Generic VM' },
]

const LOCATION_OPTIONS = [
  'eastus', 'eastus2', 'westus', 'westus2', 'westus3',
  'centralus', 'northcentralus', 'southcentralus',
  'westeurope', 'northeurope', 'uksouth', 'ukwest',
  'australiaeast', 'southeastasia', 'eastasia',
  'japaneast', 'canadacentral',
].map((v) => ({ value: v, label: v }))

function VMForm({ data, update }: { data: VMNodeData; update: (p: Partial<VMNodeData>) => void }) {
  return (
    <div>
      <SectionHeading title="Identity" />
      <Field label="Display Label">
        <TextInput value={data.label} onChange={(v) => update({ label: v })} placeholder="e.g. DC01" />
      </Field>
      <Field label="VM Name (Azure resource)">
        <TextInput value={data.vmName} onChange={(v) => update({ vmName: v })} placeholder="e.g. DC01" />
      </Field>
      <Field label="Role">
        <Select<VMRole> value={data.role} onChange={(v) => update({ role: v })} options={ROLE_OPTIONS} />
      </Field>

      <SectionHeading title="Hardware" />
      <Field label="VM Size">
        <Select<VMSize> value={data.vmSize} onChange={(v) => update({ vmSize: v })} options={VM_SIZE_OPTIONS} />
      </Field>
      <Field label="Operating System">
        <Select<OSVersion> value={data.osVersion} onChange={(v) => update({ osVersion: v })} options={OS_OPTIONS} />
      </Field>

      <SectionHeading title="Access" />
      <Field label="Admin Username">
        <TextInput value={data.adminUsername} onChange={(v) => update({ adminUsername: v })} placeholder="labadmin" />
      </Field>
      <Field label="Admin Password">
        <TextInput value={data.adminPassword} onChange={(v) => update({ adminPassword: v })} type="password" placeholder="••••••••" />
      </Field>

      {/* Role-specific fields */}
      {data.role === 'domain-controller' && (
        <>
          <SectionHeading title="Active Directory" />
          <Field label="Domain Name">
            <TextInput value={data.domainName ?? ''} onChange={(v) => update({ domainName: v })} placeholder="lab.local" />
          </Field>
          <Field label="NetBIOS Name">
            <TextInput value={data.netBIOSName ?? ''} onChange={(v) => update({ netBIOSName: v })} placeholder="LAB" />
          </Field>
          <Field label="Safe Mode Password">
            <TextInput value={data.safeModePassword ?? ''} onChange={(v) => update({ safeModePassword: v })} type="password" placeholder="••••••••" />
          </Field>
        </>
      )}

      {data.role === 'member-server' && (
        <>
          <SectionHeading title="Domain" />
          <Field label="Domain to Join">
            <TextInput value={data.domainToJoin ?? ''} onChange={(v) => update({ domainToJoin: v })} placeholder="lab.local" />
          </Field>
        </>
      )}

      {data.role === 'web-server' && (
        <>
          <SectionHeading title="Web Stack" />
          <Field label="Web Server Software">
            <Select<WebStack>
              value={data.webStack ?? 'iis'}
              onChange={(v) => update({ webStack: v })}
              options={WEB_STACK_OPTIONS}
            />
          </Field>
        </>
      )}
    </div>
  )
}

function VNetForm({ data, update }: { data: VNetNodeData; update: (p: Partial<VNetNodeData>) => void }) {
  return (
    <div>
      <SectionHeading title="Identity" />
      <Field label="Display Label">
        <TextInput value={data.label} onChange={(v) => update({ label: v })} />
      </Field>
      <Field label="VNet Name">
        <TextInput value={data.vnetName} onChange={(v) => update({ vnetName: v })} placeholder="vnet-lab" />
      </Field>

      <SectionHeading title="Networking" />
      <Field label="Address Space (CIDR)">
        <TextInput value={data.addressSpace} onChange={(v) => update({ addressSpace: v })} placeholder="10.0.0.0/16" />
      </Field>
      <Field label="Azure Region">
        <Select value={data.location} onChange={(v) => update({ location: v })} options={LOCATION_OPTIONS} />
      </Field>
    </div>
  )
}

function SubnetForm({ data, update }: { data: SubnetNodeData; update: (p: Partial<SubnetNodeData>) => void }) {
  return (
    <div>
      <SectionHeading title="Identity" />
      <Field label="Display Label">
        <TextInput value={data.label} onChange={(v) => update({ label: v })} />
      </Field>
      <Field label="Subnet Name">
        <TextInput value={data.subnetName} onChange={(v) => update({ subnetName: v })} placeholder="subnet-default" />
      </Field>

      <SectionHeading title="Networking" />
      <Field label="Address Prefix (CIDR)">
        <TextInput value={data.addressPrefix} onChange={(v) => update({ addressPrefix: v })} placeholder="10.0.1.0/24" />
      </Field>
    </div>
  )
}

function NSGForm({ data, update }: { data: NSGNodeData; update: (p: Partial<NSGNodeData>) => void }) {
  return (
    <div>
      <SectionHeading title="Identity" />
      <Field label="Display Label">
        <TextInput value={data.label} onChange={(v) => update({ label: v })} />
      </Field>
      <Field label="NSG Name">
        <TextInput value={data.nsgName} onChange={(v) => update({ nsgName: v })} placeholder="nsg-lab" />
      </Field>
      <div style={{ marginTop: 12, padding: '8px 10px', background: '#1e2130', borderRadius: 6, fontSize: 11, color: '#64748b', lineHeight: '1.5' }}>
        💡 Connect this NSG to a Subnet to associate it. Security rules can be added post-deployment in the Azure Portal or by extending the Bicep template.
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function PropertiesPanel() {
  const { selectedNodeId, nodes, updateNodeData, setSelectedNodeId } = useLabStore()

  if (!selectedNodeId) {
    return (
      <div
        style={{
          width: 280,
          flexShrink: 0,
          background: '#12151e',
          borderLeft: '1px solid #1e2130',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: 24,
        }}
      >
        <div style={{ fontSize: 28 }}>🖱️</div>
        <div style={{ color: '#334155', fontSize: 12, textAlign: 'center', lineHeight: '1.5' }}>
          Click a component on the canvas to configure its properties
        </div>
      </div>
    )
  }

  const node = nodes.find((n) => n.id === selectedNodeId)
  if (!node) return null

  const update = (patch: Record<string, unknown>) => updateNodeData(selectedNodeId, patch)

  const typeLabel: Record<string, string> = {
    vm: 'Virtual Machine',
    vnet: 'Virtual Network',
    subnet: 'Subnet',
    nsg: 'Network Security Group',
  }

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        background: '#12151e',
        borderLeft: '1px solid #1e2130',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #1e2130',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>Properties</div>
          <div style={{ color: '#475569', fontSize: 10, marginTop: 2 }}>
            {typeLabel[node.type ?? ''] ?? node.type} · {node.id}
          </div>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#475569',
            padding: 4,
            borderRadius: 4,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#94a3b8')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#475569')}
        >
          <X size={15} />
        </button>
      </div>

      {/* Form body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        {node.type === 'vm' && (
          <VMForm
            data={node.data as VMNodeData}
            update={(p) => update(p as Record<string, unknown>)}
          />
        )}
        {node.type === 'vnet' && (
          <VNetForm
            data={node.data as VNetNodeData}
            update={(p) => update(p as Record<string, unknown>)}
          />
        )}
        {node.type === 'subnet' && (
          <SubnetForm
            data={node.data as SubnetNodeData}
            update={(p) => update(p as Record<string, unknown>)}
          />
        )}
        {node.type === 'nsg' && (
          <NSGForm
            data={node.data as NSGNodeData}
            update={(p) => update(p as Record<string, unknown>)}
          />
        )}
      </div>
    </div>
  )
}
