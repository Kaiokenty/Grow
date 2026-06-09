import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'

export type TrainingBlock = {
  id: string
  name: string
  start_date: string
  end_date: string | null
  notes: string | null
  is_active: boolean
}

export type BlockTopExercise = {
  name: string
  tonnage: number
  sets: number
}

export type BlockSummary = {
  block_id: string
  name: string
  start_date: string
  end_date: string | null
  tonnage: number
  total_sets: number
  avg_rpe: number | null
  pr_count: number
  top_exercises: BlockTopExercise[]
}

export type BlockComparison = {
  block_a: BlockSummary
  block_b: BlockSummary
  volume_pct_delta: number | null
  avg_rpe_delta: number | null
}

export async function fetchTrainingBlocks(): Promise<TrainingBlock[]> {
  const { data, error } = await supabase.rpc('get_training_blocks')
  if (error) throw error
  return (data ?? []) as TrainingBlock[]
}

export async function fetchBlockSummary(blockId: string): Promise<BlockSummary> {
  const { data, error } = await supabase.rpc('get_block_summary', {
    p_block_id: blockId,
  })
  if (error) throw error
  return data as BlockSummary
}

export async function fetchBlockComparison(
  blockA: string,
  blockB: string,
): Promise<BlockComparison> {
  const { data, error } = await supabase.rpc('compare_training_blocks', {
    p_block_a: blockA,
    p_block_b: blockB,
  })
  if (error) throw error
  return data as BlockComparison
}

export async function startTrainingBlock(input: {
  name: string
  start_date?: string
  notes?: string | null
}) {
  const { data, error } = await supabase.rpc('start_training_block', {
    p_name: input.name,
    p_start_date: input.start_date ?? undefined,
    p_notes: input.notes ?? undefined,
  })
  if (error) throw error
  return data as string
}

export async function endTrainingBlock(blockId: string) {
  const { error } = await supabase.rpc('end_training_block', {
    p_block_id: blockId,
  })
  if (error) throw error
}

export const trainingBlocksQueryKey = (userId: string) =>
  queryKeys.trainingBlocks(userId)

export const blockSummaryQueryKey = (userId: string, blockId: string) =>
  queryKeys.blockSummary(userId, blockId)
