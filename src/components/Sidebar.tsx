interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const navItems = [
    { id: 'scan', icon: '🔍', label: 'New Scan' },
    { id: 'results', icon: '📋', label: 'Results' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
    { id: 'licence', icon: '🔑', label: 'Licence' },
  ]

  return (
    <div style={{
      width: '200px',
      minWidth: '200px',
      background: '#1a1a24',
      borderRight: '1px solid #2a2a3a',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 0',
    }}>
      {/* Logo */}
      <div style={{
        padding: '16px 20px 24px',
        borderBottom: '1px solid #2a2a3a',
        marginBottom: '8px',
      }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
          🔍 DupeFinder
        </div>
        <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '2px' }}>
          v1.0.3
        </div>
      </div>

      {/* Nav Items */}
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            background: currentPage === item.id ? '#2a2a3f' : 'transparent',
            border: 'none',
            borderLeft: currentPage === item.id ? '3px solid #6c63ff' : '3px solid transparent',
            color: currentPage === item.id ? '#fff' : '#888',
            cursor: 'pointer',
            fontSize: '0.9rem',
            textAlign: 'left',
            width: '100%',
            transition: 'all 0.15s ease',
          }}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export default Sidebar