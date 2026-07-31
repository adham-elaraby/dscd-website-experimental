'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Label } from '@/components/ui/label'
import { Upload, X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'

interface Props {
  urls: string[]
  onChange: (urls: string[]) => void
  folder?: 'events' | 'projects' | 'team' | 'misc'
}

export function GalleryUpload({ urls, onChange, folder = 'events' }: Props) {
  const [pending, setPending] = useState(0)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadOne(file: File, token: string) {
    const form = new FormData()
    form.append('file', file)
    form.append('type', folder)

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })

    const result = await res.json()
    if (!result.success) throw new Error(result.error)
    return result.url as string
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setError('')
    setPending(files.length)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Uploaded one at a time so a mid-batch failure still keeps the photos
      // that already made it, rather than losing the whole selection.
      const uploaded: string[] = []
      for (const file of files) {
        try {
          uploaded.push(await uploadOne(file, session.access_token))
        } catch (err) {
          setError(`${file.name}: ${err instanceof Error ? err.message : 'upload failed'}`)
        } finally {
          setPending(n => n - 1)
        }
      }

      if (uploaded.length) onChange([...urls, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setPending(0)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function removeAt(index: number) {
    onChange(urls.filter((_, i) => i !== index))
  }

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= urls.length) return
    const next = [...urls]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Event photos</Label>
        <span className="text-xs text-muted-foreground">
          {urls.length > 0 ? `${urls.length} photo${urls.length === 1 ? '' : 's'}` : 'None yet'}
        </span>
      </div>

      {urls.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {urls.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Event photo ${index + 1}`} className="h-full w-full object-cover" />

              <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-[10px] font-medium text-white">
                {index + 1}
              </span>

              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>

              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move photo ${index + 1} earlier`}
                  className="p-1 text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === urls.length - 1}
                  aria-label={`Move photo ${index + 1} later`}
                  className="p-1 text-white disabled:opacity-30"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed py-6 transition-colors hover:bg-muted/50"
        onClick={() => fileRef.current?.click()}
      >
        {pending > 0 ? (
          <>
            <div className="mb-1 h-5 w-5 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">
              Uploading {pending} photo{pending === 1 ? '' : 's'}…
            </p>
          </>
        ) : (
          <>
            {urls.length > 0 ? (
              <ImageIcon className="mb-1 h-5 w-5 text-muted-foreground" />
            ) : (
              <Upload className="mb-1 h-6 w-6 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">
              {urls.length > 0 ? 'Add more photos' : 'Click to upload event photos'}
            </p>
            <p className="text-xs text-muted-foreground">
              Select several at once — JPEG, PNG, WebP or GIF, max 5 MB each
            </p>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
      {urls.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Photos appear in the carousel in this order. Hover a photo to reorder or remove it.
        </p>
      )}
    </div>
  )
}
