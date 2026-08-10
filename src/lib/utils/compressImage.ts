/**
 * Downscales and re-encodes images in the browser before they are uploaded.
 *
 * Phone cameras produce 20+ megapixel files: one event photo measured
 * 5712x4284 at 3.7 MB, and a 21-photo gallery came to 62 MB even though the
 * carousel never displays a photo wider than about 1200 px. Nothing shrinks
 * these after the fact — next/image runs with `unoptimized: true` because
 * Cloudflare Pages has no optimizer, and Storage image transformations are not
 * enabled on this Supabase plan — so upload is the only place to do it.
 *
 * At the presets below that gallery drops to roughly 3 MB.
 */

export type ImagePreset = 'gallery' | 'cover' | 'avatar'

/**
 * Longest-edge budgets, each about 2x the widest slot the image renders in so
 * it stays sharp on high-DPI screens.
 */
const PRESETS: Record<ImagePreset, { maxEdge: number; quality: number }> = {
  gallery: { maxEdge: 1600, quality: 0.82 }, // event carousel, up to 1200 px wide
  cover: { maxEdge: 1000, quality: 0.82 },   // event/project cards, 384 px wide
  avatar: { maxEdge: 400, quality: 0.85 },   // team photos, 144 px circle
}

export async function compressImage(file: File, preset: ImagePreset = 'gallery'): Promise<File> {
  // A canvas keeps only the first frame of an animated GIF, and anything that
  // is not a bitmap image has no business going through one at all.
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file

  const { maxEdge, quality } = PRESETS[preset]

  let bitmap: ImageBitmap
  try {
    // 'from-image' applies the EXIF rotation. Without it, portrait phone shots
    // land in the canvas sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return file // undecodable here — let the server store the original
  }

  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    // JPEG covers browsers that cannot encode WebP, but only for sources that
    // cannot carry transparency: JPEG has no alpha, so a cut-out logo would
    // come back with a black box behind it.
    const blob =
      (await encode(canvas, 'image/webp', quality)) ??
      (file.type === 'image/png' ? null : await encode(canvas, 'image/jpeg', quality))

    // An already-small file can leave the canvas bigger than it went in, so
    // keep whichever version is actually smaller.
    if (!blob || blob.size >= file.size) return file

    return new File([blob], replaceExtension(file.name, blob.type), { type: blob.type })
  } finally {
    bitmap.close()
  }
}

/**
 * Resolves null when the browser cannot encode `type`. canvas.toBlob() falls
 * back to PNG silently instead of failing, and a PNG of a photo would be far
 * larger than the original we are trying to shrink.
 */
function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob?.type === type ? blob : null), type, quality)
  })
}

function replaceExtension(name: string, mime: string): string {
  const base = name.replace(/\.[^.]+$/, '') || 'image'
  return `${base}.${mime === 'image/webp' ? 'webp' : 'jpg'}`
}
