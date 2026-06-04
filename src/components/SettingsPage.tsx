import { useState, useEffect } from 'react'

interface Settings {
  quarantineFolder: string
  defaultScanType: 'exact' | 'similar' | 'both'
  defaultSimilarity: number
  includeSubfolders: boolean
  supportedFormats: string[]
}

const DEFAULT_SETTINGS: Settings = {
  quarantineFolder: '',
  defaultScanType: 'both',
  defaultSimilarity: 90,
  includeSubfolders: true,
  supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'cr2', 'nef', 'arw', 'dng', 'heic'],
}

function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('dupefinder-settings')
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch {}
    } else {
      // Set default quarantine folder
      setSettings(prev => ({
        ...prev,
        quarantineFolder: 'C:\\Users\\' + (window as any).username + '\\Pictures\\DupeFinder-Quarantine',
      }))
    }
  }, [])

  const save = () => {
    localStorage.setItem('dupefinder-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const pickQuarantineFolder = async () => {
    const paths = await window.electronAPI.openFolder()
    if (paths.length > 0) {
      setSettings(prev => ({ ...prev, quarantineFolder: paths[0] }))
    }
  }

  const toggleFormat = (format: string) => {
    setSettings(prev => ({
      ...prev,
      supportedFormats: prev.supportedFormats.includes(format)
        ? prev.supportedFormats.filter(f => f !== format)
        : [...prev.supportedFormats, format],
    }))
  }

  const allFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'cr2', 'nef', 'arw', 'dng', 'heic']

  return (
    <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Quarantine Folder */}
      <section>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', color: '#ccc' }}>
          📦 Quarantine Folder
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '12px' }}>
          Photos marked for removal are moved here instead of being permanently deleted.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            flex: 1,
            padding: '10px 14px',
            background: '#1a1a24',
            border: '1px solid #2a2a3a',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#888',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {settings.quarantineFolder || 'No folder selected'}
          </div>
          <button
            onClick={pickQuarantineFolder}
            style={{
              padding: '10px 16px',
              background: '#2a2a3f',
              border: '1px solid #4a4a6a',
              borderRadius: '8px',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            }}
          >
            Browse...
          </button>
        </div>
      </section>

      {/* Default Scan Type */}
      <section>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', color: '#ccc' }}>
          🎯 Default Scan Type
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '12px' }}>
          Pre-selects the scan type when starting a new scan.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { id: 'exact', label: '⚡ Exact Only' },
            { id: 'similar', label: '🔄 Similar Only' },
            { id: 'both', label: '✨ Both' },
          ].map(option => (
            <button
              key={option.id}
              onClick={() => setSettings(prev => ({ ...prev, defaultScanType: option.id as Settings['defaultScanType'] }))}
              style={{
                flex: 1,
                padding: '10px',
                background: settings.defaultScanType === option.id ? '#2a2a3f' : '#1a1a24',
                border: settings.defaultScanType === option.id ? '1px solid #6c63ff' : '1px solid #2a2a3a',
                borderRadius: '8px',
                color: settings.defaultScanType === option.id ? '#fff' : '#666',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* Default Similarity */}
      <section>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', color: '#ccc' }}>
          🎚️ Default Similarity Threshold
          <span style={{
            marginLeft: '10px',
            background: '#2a2a3f',
            padding: '2px 10px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            color: '#6c63ff',
          }}>
            {settings.defaultSimilarity}%
          </span>
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '12px' }}>
          Pre-sets the similarity slider when starting a new scan.
        </p>
        <input
          type="range"
          min={50}
          max={99}
          value={settings.defaultSimilarity}
          onChange={e => setSettings(prev => ({ ...prev, defaultSimilarity: Number(e.target.value) }))}
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

      {/* Include Subfolders */}
      <section>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', color: '#ccc' }}>
          ⚙️ Default Options
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
            checked={settings.includeSubfolders}
            onChange={e => setSettings(prev => ({ ...prev, includeSubfolders: e.target.checked }))}
            style={{ accentColor: '#6c63ff', width: '16px', height: '16px' }}
          />
          Include subfolders by default
        </label>
      </section>

      {/* Supported Formats */}
      <section>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', color: '#ccc' }}>
          🖼️ Supported Formats
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '12px' }}>
          Only files with these extensions will be scanned.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {allFormats.map(format => (
            <button
              key={format}
              onClick={() => toggleFormat(format)}
              style={{
                padding: '6px 14px',
                background: settings.supportedFormats.includes(format) ? '#2a2a3f' : '#1a1a24',
                border: settings.supportedFormats.includes(format) ? '1px solid #6c63ff' : '1px solid #2a2a3a',
                borderRadius: '20px',
                color: settings.supportedFormats.includes(format) ? '#fff' : '#555',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              .{format.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Save Button */}
      <button
        onClick={save}
        style={{
          padding: '14px',
          background: saved ? '#4ecdc4' : 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
          border: 'none',
          borderRadius: '10px',
          color: 'white',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'background 0.3s ease',
        }}
      >
        {saved ? '✅ Saved!' : '💾 Save Settings'}
      </button>

    </div>
  )
}

export default SettingsPage