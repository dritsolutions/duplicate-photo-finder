import { useState, useEffect } from 'react'

const KEYGEN_ACCOUNT = 'b939a4c4-45e7-4977-8b72-bc276d3c013a'

type LicenceStatus = 'unactivated' | 'activating' | 'active' | 'invalid' | 'error'

function LicencePage() {
  const [key, setKey] = useState('')
  const [status, setStatus] = useState<LicenceStatus>('unactivated')
  const [licenceInfo, setLicenceInfo] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('dupefinder-licence')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setLicenceInfo(parsed)
        setStatus('active')
        setKey(parsed.key)
      } catch {}
    }
  }, [])

  const activate = async () => {
    if (!key.trim()) {
      setErrorMsg('Please enter a licence key.')
      return
    }
    setStatus('activating')
    setErrorMsg('')
    try {
      // Step 1: Validate the key
      const response = await fetch(
        `https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT}/licenses/actions/validate-key`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json',
          },
          body: JSON.stringify({ meta: { key: key.trim() } }),
        }
      )
      const data = await response.json()

      if (!data.meta?.valid) {
        const code = data.meta?.code || 'UNKNOWN'
        if (code === 'NOT_FOUND') setErrorMsg('Licence key not found.')
        else if (code === 'EXPIRED') setErrorMsg('This licence key has expired.')
        else if (code === 'SUSPENDED') setErrorMsg('This licence key has been suspended.')
        else if (code === 'TOO_MANY_MACHINES') setErrorMsg('This licence key has reached its machine limit.')
        else setErrorMsg('Invalid licence key. Please check and try again.')
        setStatus('invalid')
        return
      }

      // Step 2: Activate this machine
      const licenceId = data.data?.id || ""
      console.log('Calling activateMachine...')
      const activation = await window.electronAPI.activateMachine(key.trim(), KEYGEN_ACCOUNT, licenceId)
      console.log('Activation result:', JSON.stringify(activation))

      // 201 = newly activated, 422 = already activated on this machine (both are fine)
      if (activation.status !== 201 && activation.status !== 422) {
        const errCode = activation.data?.errors?.[0]?.code || ''
        if (errCode === 'MACHINE_LIMIT_EXCEEDED' || errCode === 'TOO_MANY_MACHINES') {
          setErrorMsg('This licence key is already activated on another computer.')
          setStatus('invalid')
          return
        }
      }

      // Step 3: Re-validate with machine fingerprint
      const revalidation = await window.electronAPI.validateMachine(key.trim(), KEYGEN_ACCOUNT)

      if (revalidation.data?.meta?.valid) {
        const info = {
          key: key.trim(),
          id: data.data?.id,
          expiry: data.data?.attributes?.expiry || null,
          activatedAt: new Date().toISOString(),
        }
        localStorage.setItem('dupefinder-licence', JSON.stringify(info))
        setLicenceInfo(info)
        setStatus('active')
      } else {
        setErrorMsg('Machine activation failed. Please try again.')
        setStatus('invalid')
      }
    } catch (err) {
      console.error('Activation error:', err)
      setErrorMsg('Could not connect to licence server. Please check your internet connection.')
      setStatus('error')
    }
  }

  const deactivate = () => {
    const confirmed = window.confirm('Are you sure you want to deactivate this licence?')
    if (!confirmed) return
    localStorage.removeItem('dupefinder-licence')
    setLicenceInfo(null)
    setStatus('unactivated')
    setKey('')
  }

  if (status === 'active' && licenceInfo) {
    return (
      <div style={{ maxWidth: '500px' }}>
        <div style={{
          background: '#1a2a1a',
          border: '1px solid #2a4a2a',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '2rem' }}>✅</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#4ecdc4' }}>Licence Active</div>
              <div style={{ fontSize: '0.8rem', color: '#555' }}>Your copy is fully activated on this computer</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#666' }}>Licence Key</span>
              <span style={{ color: '#ccc', fontFamily: 'monospace' }}>
                {licenceInfo.key.slice(0, 8)}...{licenceInfo.key.slice(-4)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#666' }}>Activated</span>
              <span style={{ color: '#ccc' }}>{new Date(licenceInfo.activatedAt).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#666' }}>Expiry</span>
              <span style={{ color: '#ccc' }}>
                {licenceInfo.expiry ? new Date(licenceInfo.expiry).toLocaleDateString() : 'Lifetime'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={deactivate}
          style={{
            padding: '10px 20px',
            background: 'transparent',
            border: '1px solid #3a2a2a',
            borderRadius: '8px',
            color: '#666',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          Deactivate Licence
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '500px' }}>
      <div style={{
        background: '#1a1a24',
        border: '1px solid #2a2a3a',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔑</div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>
          Activate Your Licence
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '20px' }}>
          Enter your licence key below to unlock all features. Each key can only be activated on one computer.
        </p>
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && activate()}
            placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX"
            style={{
              width: '100%',
              padding: '12px 14px',
              background: '#0f0f13',
              border: errorMsg ? '1px solid #ff6b6b' : '1px solid #2a2a3a',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem',
              fontFamily: 'monospace',
              letterSpacing: '1px',
              boxSizing: 'border-box',
            }}
          />
          {errorMsg && (
            <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '6px' }}>
              {errorMsg}
            </div>
          )}
        </div>
        <button
          onClick={activate}
          disabled={status === 'activating'}
          style={{
            width: '100%',
            padding: '12px',
            background: status === 'activating' ? '#2a2a3a' : 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
            border: 'none',
            borderRadius: '8px',
            color: status === 'activating' ? '#555' : '#fff',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: status === 'activating' ? 'not-allowed' : 'pointer',
          }}
        >
          {status === 'activating' ? '⏳ Activating...' : '🔑 Activate Licence'}
        </button>
      </div>
      <div style={{
        background: '#1a1a24',
        border: '1px solid #2a2a3a',
        borderRadius: '12px',
        padding: '20px',
      }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: '#888' }}>
          Don't have a licence key?
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '12px' }}>
          Purchase a licence key to unlock all features including unlimited scans and RAW file support.
        </p>
        <a
          href="#"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: '#2a2a3f',
            border: '1px solid #4a4a6a',
            borderRadius: '8px',
            color: '#6c63ff',
            fontSize: '0.85rem',
            textDecoration: 'none',
          }}
        >
          🛒 Purchase a Licence
        </a>
      </div>
    </div>
  )
}

export default LicencePage
