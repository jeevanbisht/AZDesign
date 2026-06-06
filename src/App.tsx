import { ReactFlowProvider } from '@xyflow/react'
import { Toolbar } from './components/Toolbar/Toolbar'
import { ComponentPalette } from './components/Palette/ComponentPalette'
import { LabCanvas } from './components/Canvas/LabCanvas'
import { PropertiesPanel } from './components/Properties/PropertiesPanel'

export default function App() {
  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f1117', color: '#e2e8f0', overflow: 'hidden' }}>
        <Toolbar />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <ComponentPalette />
          <LabCanvas />
          <PropertiesPanel />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
