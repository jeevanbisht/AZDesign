import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Toolbar } from './components/Toolbar/Toolbar'
import { ComponentPalette } from './components/Palette/ComponentPalette'
import { LabCanvas } from './components/Canvas/LabCanvas'
import { PropertiesPanel } from './components/Properties/PropertiesPanel'
import { useMobile } from './hooks/useMobile'

export default function App() {
  const isMobile = useMobile()
  const [showPalette, setShowPalette] = useState(false)
  const [showProperties, setShowProperties] = useState(false)

  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f1117', color: '#e2e8f0', overflow: 'hidden' }}>
        <Toolbar
          isMobile={isMobile}
          onTogglePalette={() => setShowPalette((v) => !v)}
          onToggleProperties={() => setShowProperties((v) => !v)}
        />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

          {/* ── Palette panel ── */}
          {isMobile ? (
            // Mobile: slide-in overlay from the left
            <>
              {showPalette && (
                <div
                  style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }}
                  onClick={() => setShowPalette(false)}
                />
              )}
              <div style={{
                position: 'fixed',
                top: 50,
                left: 0,
                bottom: 0,
                width: 240,
                zIndex: 201,
                transform: showPalette ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.25s ease',
              }}>
                <ComponentPalette onItemTap={() => setShowPalette(false)} />
              </div>
            </>
          ) : (
            <ComponentPalette />
          )}

          {/* ── Canvas (always full-width on mobile) ── */}
          <LabCanvas />

          {/* ── Properties panel ── */}
          {isMobile ? (
            // Mobile: slide-in overlay from the right
            <>
              {showProperties && (
                <div
                  style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }}
                  onClick={() => setShowProperties(false)}
                />
              )}
              <div style={{
                position: 'fixed',
                top: 50,
                right: 0,
                bottom: 0,
                width: '85vw',
                maxWidth: 360,
                zIndex: 201,
                transform: showProperties ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.25s ease',
              }}>
                <PropertiesPanel />
              </div>
            </>
          ) : (
            <PropertiesPanel />
          )}

        </div>
      </div>
    </ReactFlowProvider>
  )
}
