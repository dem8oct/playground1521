import { useState } from 'react'
import { Button, Input } from '../ui'
import { createGroup } from '../../lib/api/groups'

interface CreateGroupFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateGroupForm({ onSuccess, onCancel }: CreateGroupFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (name.length < 3 || name.length > 50) {
      setError('Group name must be between 3 and 50 characters')
      return
    }

    setLoading(true)

    try {
      await createGroup({ name, description: description || undefined })
      setName('')
      setDescription('')
      onSuccess?.()
    } catch (err: any) {
      console.error('Error creating group:', err)
      setError(err.message || 'Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          label="Group Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Gaming Group"
          required
          minLength={3}
          maxLength={50}
          disabled={loading}
        />
        <p className="text-sm text-gray-400 mt-1">3-50 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          placeholder="Describe your group..."
          rows={3}
          disabled={loading}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading ? 'Creating...' : 'Create Group'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
