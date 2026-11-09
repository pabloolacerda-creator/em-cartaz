import { supabase } from './supabase'
test('exporta um cliente supabase com auth', () => {
  expect(supabase).toBeDefined()
  expect(typeof supabase.auth.getSession).toBe('function')
})
