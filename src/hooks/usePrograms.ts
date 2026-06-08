import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

export type Program = Database['public']['Tables']['programs']['Row']
export type ProgramExercise =
  Database['public']['Tables']['program_exercises']['Row'] & {
    exercises: Database['public']['Tables']['exercises']['Row']
  }

export function usePrograms(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.programs(userId ?? ''),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', userId!)
        .order('name')

      if (error) throw error
      return data as Program[]
    },
  })
}

export function useProgramExercises(programId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.programExercises(programId ?? ''),
    enabled: Boolean(programId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_exercises')
        .select('*, exercises(*)')
        .eq('program_id', programId!)
        .order('sort_order')

      if (error) throw error
      return data as ProgramExercise[]
    },
  })
}

export function useSaveProgram(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      name,
      notes,
      exerciseIds,
    }: {
      id?: string
      name: string
      notes: string
      exerciseIds: string[]
    }) => {
      if (!userId) throw new Error('Not signed in')

      let programId = id

      if (programId) {
        const { error } = await supabase
          .from('programs')
          .update({ name, notes: notes.trim() || null })
          .eq('id', programId)

        if (error) throw error

        const { error: deleteError } = await supabase
          .from('program_exercises')
          .delete()
          .eq('program_id', programId)

        if (deleteError) throw deleteError
      } else {
        const { data, error } = await supabase
          .from('programs')
          .insert({
            user_id: userId,
            name,
            notes: notes.trim() || null,
          })
          .select('id')
          .single()

        if (error) throw error
        programId = data.id
      }

      if (exerciseIds.length > 0) {
        const rows = exerciseIds.map((exerciseId, index) => ({
          program_id: programId!,
          exercise_id: exerciseId,
          sort_order: index,
        }))

        const { error: insertError } = await supabase
          .from('program_exercises')
          .insert(rows)

        if (insertError) throw insertError
      }

      return programId!
    },
    onSuccess: (programId) => {
      if (!userId) return
      void queryClient.invalidateQueries({ queryKey: queryKeys.programs(userId) })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.programExercises(programId),
      })
    },
  })
}

export function useDeleteProgram(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (programId: string) => {
      const { error } = await supabase.from('programs').delete().eq('id', programId)
      if (error) throw error
    },
    onSuccess: () => {
      if (!userId) return
      void queryClient.invalidateQueries({ queryKey: queryKeys.programs(userId) })
    },
  })
}
