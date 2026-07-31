'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TeamMember } from '@/lib/types'
import { ImageUpload } from './ImageUpload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  member?: TeamMember
  onSuccess: () => void
  onCancel: () => void
}

export function TeamMemberForm({ member, onSuccess, onCancel }: Props) {
  const isEdit = !!member

  const [fields, setFields] = useState({
    name: member?.name ?? '',
    role: member?.role ?? '',
    bio: member?.bio ?? '',
    imageUrl: member?.imageUrl ?? '',
    github: member?.socialLinks?.github ?? '',
    linkedin: member?.socialLinks?.linkedin ?? '',
    twitter: member?.socialLinks?.twitter ?? '',
    website: member?.socialLinks?.website ?? '',
    email: member?.socialLinks?.email ?? '',
    isLeadership: member?.isLeadership ?? false,
    orderIndex: member?.position?.toString() ?? '',
  })

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
        name: fields.name,
        role: fields.role,
        bio: fields.bio,
        imageUrl: fields.imageUrl,
        socialLinks: {
          github: fields.github || undefined,
          linkedin: fields.linkedin || undefined,
          twitter: fields.twitter || undefined,
          website: fields.website || undefined,
          email: fields.email || undefined,
        },
        isLeadership: fields.isLeadership,
        position: fields.orderIndex ? parseInt(fields.orderIndex) : undefined,
      }

      const url = isEdit ? `/api/admin/team/${member.id}` : '/api/admin/team'
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
      setError(err instanceof Error ? err.message : 'Failed to save team member')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Team Member' : 'New Team Member'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUpload currentUrl={fields.imageUrl} onUpload={(url) => set('imageUrl', url)} folder="team" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" required value={fields.name} onChange={e => set('name', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Role *</Label>
              <Input id="role" required placeholder="e.g. DSC Lead" value={fields.role} onChange={e => set('role', e.target.value)} />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="bio">Bio *</Label>
              <textarea
                id="bio"
                required
                rows={3}
                value={fields.bio}
                onChange={e => set('bio', e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="github">GitHub URL</Label>
              <Input id="github" type="url" placeholder="https://github.com/…" value={fields.github} onChange={e => set('github', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input id="linkedin" type="url" placeholder="https://linkedin.com/in/…" value={fields.linkedin} onChange={e => set('linkedin', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="twitter">Twitter URL</Label>
              <Input id="twitter" type="url" placeholder="https://twitter.com/…" value={fields.twitter} onChange={e => set('twitter', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="website">Portfolio / Website URL</Label>
              <Input id="website" type="url" placeholder="https://yoursite.com" value={fields.website} onChange={e => set('website', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" value={fields.email} onChange={e => set('email', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="orderIndex">Display Order</Label>
              <Input id="orderIndex" type="number" min="1" placeholder="1" value={fields.orderIndex} onChange={e => set('orderIndex', e.target.value)} />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                id="isLeadership"
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={fields.isLeadership}
                onChange={e => set('isLeadership', e.target.checked)}
              />
              <Label htmlFor="isLeadership">Leadership team member</Label>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add member'}</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
