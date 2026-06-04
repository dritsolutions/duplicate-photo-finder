import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { Jimp } from 'jimp'

export interface ScannedPhoto {
  id: string
  path: string
  size: number
  modified: Date
  hash: string | null
  pHash: string | null
}

export interface DuplicateGroup {
  id: string
  type: 'exact' | 'similar'
  similarity: number
  photos: ScannedPhoto[]
}

const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
  '.tiff', '.tif', '.cr2', '.nef', '.arw', '.dng', '.heic'
])

// Walk folders recursively and collect image file paths
export function collectImageFiles(
  folders: string[],
  includeSubfolders: boolean
): string[] {
  const files: string[] = []

  function walk(dir: string, isRoot: boolean) {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (includeSubfolders || isRoot) walk(fullPath, false)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (IMAGE_EXTENSIONS.has(ext)) files.push(fullPath)
      }
    }
  }

  for (const folder of folders) walk(folder, true)
  return files
}

// SHA-256 hash for exact duplicate detection
export function hashFile(filePath: string): string {
  const buffer = fs.readFileSync(filePath)
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

// Perceptual hash for similar image detection
export async function perceptualHash(filePath: string): Promise<string | null> {
  try {
    const image = await Jimp.read(filePath)
    image.resize(8, 8).grayscale()
    const pixels: number[] = []
    image.scan(0, 0, 8, 8, function (_x, _y, idx) {
      pixels.push(this.bitmap.data[idx])
    })
    const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length
    return pixels.map(p => (p >= avg ? '1' : '0')).join('')
  } catch {
    return null
  }
}

// Hamming distance between two binary strings
function hammingDistance(a: string, b: string): number {
  let dist = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) dist++
  }
  return dist
}

// Convert hamming distance to similarity percentage
function toSimilarity(distance: number, length: number): number {
  return Math.round((1 - distance / length) * 100)
}

// Main scan function
export async function scanFolders(
  folders: string[],
  includeSubfolders: boolean,
  scanType: 'exact' | 'similar' | 'both',
  similarityThreshold: number,
  onProgress: (current: number, total: number, file: string) => void
): Promise<DuplicateGroup[]> {

  const files = collectImageFiles(folders, includeSubfolders)
  const total = files.length
  const photos: ScannedPhoto[] = []

  // Step 1 — Hash all files
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i]
    onProgress(i + 1, total, filePath)

    let stat: fs.Stats
    try {
      stat = fs.statSync(filePath)
    } catch {
      continue
    }

    const photo: ScannedPhoto = {
      id: Math.random().toString(36).slice(2),
      path: filePath,
      size: stat.size,
      modified: stat.mtime,
      hash: null,
      pHash: null,
    }

    if (scanType === 'exact' || scanType === 'both') {
      try { photo.hash = hashFile(filePath) } catch { }
    }

    if (scanType === 'similar' || scanType === 'both') {
      photo.pHash = await perceptualHash(filePath)
    }

    photos.push(photo)
  }

  const groups: DuplicateGroup[] = []

  // Step 2 — Find exact duplicates
  if (scanType === 'exact' || scanType === 'both') {
    const hashMap = new Map<string, ScannedPhoto[]>()
    for (const photo of photos) {
      if (!photo.hash) continue
      if (!hashMap.has(photo.hash)) hashMap.set(photo.hash, [])
      hashMap.get(photo.hash)!.push(photo)
    }
    for (const [, group] of hashMap) {
      if (group.length > 1) {
        groups.push({
          id: Math.random().toString(36).slice(2),
          type: 'exact',
          similarity: 100,
          photos: group,
        })
      }
    }
  }

  // Step 3 — Find similar duplicates
  if (scanType === 'similar' || scanType === 'both') {
    const exactPaths = new Set(
      groups.flatMap(g => g.photos.map(p => p.path))
    )
    const candidates = photos.filter(p => p.pHash && !exactPaths.has(p.path))
    const used = new Set<string>()

    for (let i = 0; i < candidates.length; i++) {
      if (used.has(candidates[i].id)) continue
      const group: ScannedPhoto[] = [candidates[i]]
      let minSimilarity = 100

      for (let j = i + 1; j < candidates.length; j++) {
        if (used.has(candidates[j].id)) continue
        const dist = hammingDistance(candidates[i].pHash!, candidates[j].pHash!)
        const sim = toSimilarity(dist, candidates[i].pHash!.length)
        if (sim >= similarityThreshold) {
          group.push(candidates[j])
          minSimilarity = Math.min(minSimilarity, sim)
          used.add(candidates[j].id)
        }
      }

      if (group.length > 1) {
        used.add(candidates[i].id)
        groups.push({
          id: Math.random().toString(36).slice(2),
          type: 'similar',
          similarity: minSimilarity,
          photos: group,
        })
      }
    }
  }

  return groups
}