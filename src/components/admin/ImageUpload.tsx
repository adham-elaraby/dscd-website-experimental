'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/utils/compressImage'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, AlertCircle } from 'lucide-react'

interface Props {
  currentUrl?: string
  onUpload: (url: string) => void
  folder?: 'events' | 'projects' | 'team' | 'misc'
}

export function ImageUpload({ currentUrl, onUpload, folder = 'misc' }: Props) {
  const [preview, setPreview] = useState(currentUrl || '')
  const [uploading, setUploading] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setImgError(false)
    setUploading(true)

    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Team photos render in a 144 px circle and covers in a 384 px card, so
      // they are downscaled harder than gallery photos.
      const form = new FormData()
      form.append('file', await compressImage(file, folder === 'team' ? 'avatar' : 'cover'))
      form.append('type', folder)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      })

      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      URL.revokeObjectURL(localUrl)
      setPreview(result.url)
      onUpload(result.url)
    } catch (err) {
      URL.revokeObjectURL(localUrl)
      setPreview('')
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleClear() {
    setPreview('')
    setImgError(false)
    onUpload('')
  }

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImgError(false)
    setPreview(e.target.value)
    onUpload(e.target.value)
  }

  return (
    <div className="space-y-2">
      <Label>Image</Label>

      {preview && !imgError ? (
        <div className="relative w-full h-40 rounded-md overflow-hidden border bg-muted">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            </div>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : imgError ? (
        <div className="w-full h-40 rounded-md border border-destructive/50 bg-destructive/10 flex flex-col items-center justify-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-xs text-destructive">Image failed to load</p>
          <button type="button" onClick={handleClear} className="text-xs underline text-muted-foreground">
            Clear and try again
          </button>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-6 w-6 text-muted-foreground mb-1" />
          <p className="text-sm text-muted-foreground">Click to upload image</p>
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or GIF — max 5 MB</p>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="pt-1">
        <Label className="text-xs text-muted-foreground">Or paste an image URL</Label>
        <Input
          type="url"
          placeholder="https://example.com/image.jpg"
          value={imgError ? preview : (uploading ? '' : preview)}
          onChange={handleUrlChange}
          className="mt-1 text-sm"
        />
      </div>
    </div>
  )
}
