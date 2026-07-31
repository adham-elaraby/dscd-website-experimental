'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Event } from '@/lib/types'
import { ImageUpload } from './ImageUpload'
import { GalleryUpload } from './GalleryUpload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  event?: Event
  onSuccess: () => void
  onCancel: () => void
}

export function EventForm({ event, onSuccess, onCancel }: Props) {
  const isEdit = !!event

  const [fields, setFields] = useState({
    title: event?.title ?? '',
    description: event?.description ?? '',
    date: event?.date ? event.date.slice(0, 16) : '',
    location: event?.location ?? '',
    imageUrl: event?.imageUrl ?? '',
    registrationLink: event?.registrationLink ?? '',
    maxParticipants: event?.maxParticipants?.toString() ?? '',
    tags: event?.tags?.join(', ') ?? '',
    targetAudience: event?.targetAudience ?? '',
    learningObjectives: event?.learningObjectives?.join('\n') ?? '',
    requirements: event?.requirements?.join('\n') ?? '',
    is_featured: event?.is_featured ?? false,
  })

  // Kept out of `fields` because `set` only handles string | boolean values.
  const [galleryImages, setGalleryImages] = useState<string[]>(event?.galleryImages ?? [])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key: string, value: string | boolean) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const payload = {
        title: fields.title,
        description: fields.description,
        date: new Date(fields.date).toISOString(),
        location: fields.location,
        imageUrl: fields.imageUrl,
        registrationLink: fields.registrationLink || undefined,
        maxParticipants: fields.maxParticipants ? parseInt(fields.maxParticipants) : undefined,
        tags: fields.tags.split(',').map(t => t.trim()).filter(Boolean),
        targetAudience: fields.targetAudience || undefined,
        learningObjectives: fields.learningObjectives.split('\n').map(s => s.trim()).filter(Boolean),
        requirements: fields.requirements.split('\n').map(s => s.trim()).filter(Boolean),
        is_featured: fields.is_featured,
        galleryImages,
      }

      const url = isEdit ? `/api/admin/events/${event.id}` : '/api/admin/events'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Event' : 'New Event'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUpload currentUrl={fields.imageUrl} onUpload={(url) => set('imageUrl', url)} folder="events" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" required value={fields.title} onChange={e => set('title', e.target.value)} />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                required
                rows={3}
                value={fields.description}
                onChange={e => set('description', e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date">Date & Time *</Label>
              <Input id="date" type="datetime-local" required value={fields.date} onChange={e => set('date', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" required value={fields.location} onChange={e => set('location', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" placeholder="workshop, AI, community" value={fields.tags} onChange={e => set('tags', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input id="maxParticipants" type="number" min="1" value={fields.maxParticipants} onChange={e => set('maxParticipants', e.target.value)} />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="registrationLink">Registration Link</Label>
              <Input id="registrationLink" type="url" placeholder="https://…" value={fields.registrationLink} onChange={e => set('registrationLink', e.target.value)} />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input id="targetAudience" placeholder="e.g. students of all skill levels" value={fields.targetAudience} onChange={e => set('targetAudience', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="learningObjectives">Learning Objectives (one per line)</Label>
              <textarea
                id="learningObjectives"
                rows={3}
                value={fields.learningObjectives}
                onChange={e => set('learningObjectives', e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="requirements">Requirements (one per line)</Label>
              <textarea
                id="requirements"
                rows={3}
                value={fields.requirements}
                onChange={e => set('requirements', e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is_featured"
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={fields.is_featured}
                onChange={e => set('is_featured', e.target.checked)}
              />
              <Label htmlFor="is_featured">Featured event</Label>
            </div>

            <div className="sm:col-span-2 border-t pt-4">
              <GalleryUpload urls={galleryImages} onChange={setGalleryImages} folder="events" />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
