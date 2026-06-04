import ScanPage from './components/ScanPage'
import { useState } from 'react'
import Sidebar from './components/Sidebar'

function App() {
  const [currentPage, setCurrentPage] = useState('scan')

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#0f0f13',
      color: 'white',
    }}>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid #2a2a3a',
          background: '#1a1a24',
        }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 600 }}>
            {currentPage === 'scan' && '🔍 New Scan'}
            {currentPage === 'results' && '📋 Results'}
            {currentPage === 'settings' && '⚙️ Settings'}
            {currentPage === 'licence' && '🔑 Licence'}
          </h1>
        </div>

        {/* Page Content */}
        <div style={{
          flex: 1,
          padding: '28px',
          overflowY: 'auto',
        }}>
          {currentPage === 'scan' && <ScanPage />}
          {currentPage === 'results' && (
            <p style={{ color: '#888' }}>Results page coming soon...</p>
          )}
          {currentPage === 'settings' && (
            <p style={{ color: '#888' }}>Settings page coming soon...</p>
          )}
          {currentPage === 'licence' && (
            <p style={{ color: '#888' }}>Licence page coming soon...</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App