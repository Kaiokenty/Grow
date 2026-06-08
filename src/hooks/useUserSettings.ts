import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type UserSettings = Database['public']['Tables']['users_settings']['Row']
type UserSettingsUpdate =
  Database['public']['Tables']['users_settings']['Update']

export function useUserSettings(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.userSettings(userId ?? ''),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users_settings')
        .select('*')
        .eq('user_id', userId!)
        .single()

      if (error) throw error
      return data as UserSettings
    },
  })
}

export function useUpdateUserSettings(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (patch: UserSettingsUpdate) => {
      if (!userId) throw new Error('Not signed in')

      const { data, error } = await supabase
        .from('users_settings')
        .update(patch)
        .eq('user_id', userId)
        .select('*')
        .single()

      if (error) throw error
      return data as UserSettings
    },
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.userSettings(userId),
        })
      }
    },
  })
}
