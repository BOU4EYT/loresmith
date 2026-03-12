import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const jar = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get:    name => jar.get(name)?.value,
        set:    (name, value, opts) => jar.set({ name, value, ...opts }),
        remove: (name, opts) => jar.set({ name, value: '', ...opts }),
      },
    }
  )
}
