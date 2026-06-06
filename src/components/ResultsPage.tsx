import { useState } from 'react'
import LazyImage from './LazyImage'

interface Photo {
  id: string
  path: string
  size: number
  modified: Date
}

interface DuplicateGroup {
  id: string
  type: 'exact' | 'similar'
  similarity: number
  photos: Photo[]
}

interface ResultsPageProps {
  results: DuplicateGroup[]
  onNewScan: () => void
  isLicenced: boolean
  actionsRemaining: number
  performAction: () => boolean
  onUpgrade: () => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ResultsPage({ results, onNewScan, isLicenced, actionsRemaining, performAction, onUpgrade }: ResultsPageProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [deletedPhotos, setDeletedPhotos] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(results.map(r => r.id))
  )
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 50

  const togglePhoto = (photoId: string) => {
    setSelectedPhotos(prev => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else next.add(photoId)
      return next
    })
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const autoSelectDuplicates = () => {
    const newSelected = new Set<string>()
    for (const group of results) {
      group.photos.slice(1).forEach(p => newSelected.add(p.id))
    }
    setSelectedPhotos(newSelected)
  }

  const moveToQuarantine = async () => {
    if (selectedPhotos.size === 0) {
      alert('No photos selected.')
      return
    }

    // Check trial limit
    if (!performAction()) {
      const upgrade = window.confirm(
        'You have used all 3 free quarantine actions.\n\nUpgrade to unlock unlimited actions and all features.\n\nClick OK to go to the licence page.'
      )
      if (upgrade) onUpgrade()
      return
    }

    const confirmed = window.confirm(
      `Move ${selectedPhotos.size} photo(s) to quarantine folder? You can review and permanently delete them later.`
    )
    if (!confirmed) return

    const paths = results
      .flatMap(g => g.photos)
      .filter(p => selectedPhotos.has(p.id))
      .map(p => p.path)

    try {
      const moved = await window.electronAPI.moveToQuarantine(paths)
      setDeletedPhotos(prev => new Set([...prev, ...moved]))
      setSelectedPhotos(new Set())
      alert(`${moved.length} photo(s) moved to quarantine successfully.`)
    } catch {
      alert('Failed to move photos. Please try again.')
    }
  }

  const activeResults = results
    .map(group => ({
      ...group,
      photos: group.photos.filter(p => !deletedPhotos.has(p.id))
    }))
    .filter(group => group.photos.length > 1)

  const totalWasted = results
    .flatMap(g => g.photos.slice(1))
    .filter(p => !deletedPhotos.has(p.id))
    .reduce((acc, p) => acc + p.size, 0)

  if (results.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '16px',
        color: '#888',
      }}>
        <div style={{ fontSize: '3rem' }}>✨</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>No duplicates found!</div>
        <div style={{ fontSize: '0.9rem' }}>Your photos are all unique.</div>
        <button
          onClick={onNewScan}
          style={{
            marginTop: '8px',
            padding: '10px 24px',
            background: '#2a2a3f',
            border: '1px solid #4a4a6a',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          🔍 New Scan
        </button>
      </div>
    )
  }

  const visibleResults = activeResults.slice(0, page * PAGE_SIZE)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>

      {/* Summary Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#1a1a24',
        border: '1px solid #2a2a3a',
        borderRadius: '10px',
        padding: '16px 20px',
        flexWrap: 'wrap',
        gap: '12px',
        flexShrink: 0,
      }}>
        {/* Trial Banner */}
      {!isLicenced && (
        <div style={{
          background: '#2a1a0a',
          border: '1px solid #f9ca24',
          borderRadius: '8px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '0.85rem', color: '#f9ca24' }}>
            ⚡ Trial Mode — {actionsRemaining} free quarantine action{actionsRemaining !== 1 ? 's' : ''} remaining
          </div>
          <button
            onClick={onUpgrade}
            style={{
              padding: '6px 14px',
              background: '#f9ca24',
              border: 'none',
              borderRadius: '6px',
              color: '#000',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Upgrade
          </button>
        </div>
      )}
        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6c63ff' }}>{activeResults.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Duplicate Groups</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4ecdc4' }}>{formatSize(totalWasted)}</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Reclaimable Space</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f9ca24' }}>{selectedPhotos.size}</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Selected</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={autoSelectDuplicates}
            style={{
              padding: '8px 16px',
              background: '#2a2a3f',
              border: '1px solid #4a4a6a',
              borderRadius: '8px',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            ✨ Auto-Select Duplicates
          </button>
          <button
            onClick={moveToQuarantine}
            disabled={selectedPhotos.size === 0}
            style={{
              padding: '8px 16px',
              background: selectedPhotos.size > 0 ? 'linear-gradient(135deg, #6c63ff, #4ecdc4)' : '#2a2a3a',
              border: 'none',
              borderRadius: '8px',
              color: selectedPhotos.size > 0 ? '#fff' : '#555',
              cursor: selectedPhotos.size > 0 ? 'pointer' : 'not-allowed',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            📦 Move to Quarantine
          </button>
          <button
            onClick={onNewScan}
            style={{
              padding: '8px 16px',
              background: '#2a2a3f',
              border: '1px solid #4a4a6a',
              borderRadius: '8px',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            🔍 New Scan
          </button>
        </div>
      </div>

      {/* Duplicate Groups */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }}>
        {visibleResults.map((group, groupIndex) => (
          <div key={group.id} style={{
            background: '#1a1a24',
            border: '1px solid #2a2a3a',
            borderRadius: '10px',
            overflow: 'visible',
          }}>
            {/* Group Header */}
            <div
              onClick={() => toggleGroup(group.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: expandedGroups.has(group.id) ? '1px solid #2a2a3a' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  background: group.type === 'exact' ? '#6c63ff22' : '#4ecdc422',
                  color: group.type === 'exact' ? '#6c63ff' : '#4ecdc4',
                  padding: '2px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}>
                  {group.type === 'exact' ? '⚡ Exact' : `🔄 ${group.similarity}% Similar`}
                </span>
                <span style={{ color: '#888', fontSize: '0.85rem' }}>
                  Group {groupIndex + 1} — {group.photos.length} photos
                </span>
              </div>
              <span style={{ color: '#555' }}>{expandedGroups.has(group.id) ? '▲' : '▼'}</span>
            </div>

            {/* Photos Grid */}
            {expandedGroups.has(group.id) && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '16px',
                alignItems: 'flex-start',
              }}>
                {group.photos.map((photo, photoIndex) => {
                  const isSelected = selectedPhotos.has(photo.id)
                  const filename = photo.path.split('\\').pop() || photo.path

                  return (
                    <div
                      key={photo.id}
                      onClick={() => togglePhoto(photo.id)}
                      style={{
                        width: '200px',
                        background: '#0f0f13',
                        border: isSelected ? '2px solid #ff6b6b' : '2px solid #2a2a3a',
                        borderRadius: '8px',
                        overflow: 'visible',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      {/* Photo Preview */}
                      <div style={{ position: 'relative' }}>
                        <LazyImage
                          src={`file://${photo.path}`}
                          alt={filename}
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            borderRadius: '6px 6px 0 0',
                          }}
                        />
                        {photoIndex === 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '6px',
                            left: '6px',
                            background: '#4ecdc4',
                            color: '#000',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}>
                            KEEP
                          </div>
                        )}
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: '#ff6b6b',
                            color: '#fff',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}>
                            REMOVE
                          </div>
                        )}
                      </div>

                      {/* Photo Info */}
                      <div style={{ padding: '8px' }}>
                        <div style={{
                          fontSize: '0.72rem',
                          color: '#ccc',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: '4px',
                        }}>
                          {filename}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#555' }}>
                          {formatSize(photo.size)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}

        {/* Load More */}
        {activeResults.length > page * PAGE_SIZE && (
          <button
            onClick={() => setPage(p => p + 1)}
            style={{
              padding: '12px',
              background: '#2a2a3f',
              border: '1px dashed #4a4a6a',
              borderRadius: '8px',
              color: '#888',
              cursor: 'pointer',
              fontSize: '0.9rem',
              width: '100%',
            }}
          >
            Load More ({activeResults.length - page * PAGE_SIZE} remaining)
          </button>
        )}
      </div>
    </div>
  )
}

export default ResultsPage
