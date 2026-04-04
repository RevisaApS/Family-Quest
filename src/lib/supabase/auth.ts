'use client'

import { createClient } from './client'

export async function ensureSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.error('Failed to create anonymous session:', error)
      return null
    }

    if (data.user) {
      await supabase.from('families').insert({
        id: data.user.id,
      })
    }

    return data.session
  }

  return session
}
