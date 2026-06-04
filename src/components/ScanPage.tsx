import { useState } from 'react'

interface ScanFolder {
  path: string
  id: string
}

interface ScanPageProps {
  onScanComplete: (results: any[]) => void
  onScanStart: (progress: { current: number, total: number, file: string }) => void
  onNavigate: (page: string) => void
}

function ScanPage({ onScanComplete, onScanStart, onNavigate }: ScanPageProps) {
  const [folders, setFolders] = useState<ScanFolder[]>([])
  const [similarity, setSimilarity] = useState(90)
  const [scanType, setScanType] = useState<'exact' | 'similar' | 'both'>('both')
  const [includeSubfolders, setIncludeSubfolders] = useState(true)
  const [isScanning, setIsScanning] = useState(false)

  const addFolder = async () => {
    const paths = await window.electronAPI.openFolder()
    if (paths.length === 0) return
    const newFolders = paths.map(p => ({
      path: p,
      id: Math.random().toString(36).slice(2),
    }))
    setFolders(prev => {
      const existing = prev.map(f => f.path)
      const unique = newFolders.filter(f => !existing.includes(f.path))
      return [...prev, ...unique]
    })
  }

  const removeFolder = (id: string) => {
    setFolders(folders.filter(f => f.id !== id))
  }

  const startScan = async () => {
    if (folders.length === 0) {
      alert('Please add at least one folder to scan.')
      return
    }

    setIsScanning(true)
    onNavigate('progress')

    window.electronAPI.onScanProgress((data) => {
      onScanStart(data)
    })

    try {
      const results = await window.electronAPI.startScan(
        folders.map(f => f.path),
        includeSubfolders,
        scanType,
        similarity
      )
      window.electronAPI.removeScanProgressListener()
      onScanComplete(results)
      onNavigate('results')
    } catch (err) {
      console.error('Scan failed:', err)
      alert('Scan failed. Please try again.')
      onNavigate('scan')
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div style={{ maxWidth: '700px' }}>

      {/* Folder Selection */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#ccc' }}>
          📁 Folders to Scan
        </h2>
        <div style={{
          background: '#1a1a24',
          border: '1px solid #2a2a3a',
          borderRadius: '8px',
          marginBottom: '10px',
          minHeight: '80px',
        }}>
          {folders.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: '#555',
              fontSize: '0.9rem',
            }}>
              No folders added yet. Click below to add a folder.
            </div>
          ) : (
            folders.map(folder => (
              <div key={folder.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid #2a2a3a',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>📁</span>
                  <span style={{ fontSize: '0.85rem', color: '#ccc' }}>{folder.path}</span>
                </div>
                <button
                  onClick={() => removeFolder(folder.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#555',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
        <button
          onClick={addFolder}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: '#2a2a3f',
            border: '1px dashed #4a4a6a',
            borderRadius: '8px',
            color: '#888',
            cursor: 'pointer',
            fontSize: '0.9rem',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          + Add Folder
        </button>
      </section>

      {/* Scan Type */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#ccc' }}>
          🎯 Scan Type
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { id: 'exact', label: '⚡ Exact Only', desc: 'Identical files' },
            { id: 'similar', label: '🔄 Similar Only', desc: 'Near duplicates' },
            { id: 'both', label: '✨ Both', desc: 'Recommended' },
          ].map(option => (
            <button
              key={option.id}
              onClick={() => setScanType(option.id as typeof scanType)}
              style={{
                flex: 1,
                padding: '14px 10px',
                background: scanType === option.id ? '#2a2a3f' : '#1a1a24',
                border: scanType === option.id ? '1px solid #6c63ff' : '1px solid #2a2a3a',
                borderRadius: '8px',
                color: scanType === option.id ? '#fff' : '#666',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{option.label}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#888' }}>{option.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Similarity Threshold */}
      {(scanType === 'similar' || scanType === 'both') && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#ccc' }}>
            🎚️ Similarity Threshold
            <span style={{
              marginLeft: '10px',
              background: '#2a2a3f',
              padding: '2px 10px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              color: '#6c63ff',
            }}>
              {similarity}%
            </span>
          </h2>
          <input
            type="range"
            min={50}
            max={99}
            value={similarity}
            onChange={e => setSimilarity(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#6c63ff' }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: '#555',
            marginTop: '6px',
          }}>
            <span>50% — More results</span>
            <span>99% — Near identical only</span>
          </div>
        </section>
      )}

      {/* Options */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#ccc' }}>
          ⚙️ Options
        </h2>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          color: '#aaa',
          fontSize: '0.9rem',
        }}>
          <input
            type="checkbox"
            checked={includeSubfolders}
            onChange={e => setIncludeSubfolders(e.target.checked)}
            style={{ accentColor: '#6c63ff', width: '16px', height: '16px' }}
          />
          Include subfolders
        </label>
      </section>

      {/* Start Scan Button */}
      <button
        onClick={startScan}
        disabled={isScanning}
        style={{
          width: '100%',
          padding: '16px',
          background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
          border: 'none',
          borderRadius: '10px',
          color: 'white',
          fontSize: '1.1rem',
          fontWeight: 700,
          cursor: isScanning ? 'not-allowed' : 'pointer',
          opacity: isScanning ? 0.7 : 1,
          letterSpacing: '0.5px',
        }}
      >
        🚀 Start Scan
      </button>
    </div>
  )
}

export default ScanPage