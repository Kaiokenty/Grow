import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  blockSummaryQueryKey,
  endTrainingBlock,
  fetchBlockComparison,
  fetchBlockSummary,
  fetchTrainingBlocks,
  startTrainingBlock,
  trainingBlocksQueryKey,
} from '@/lib/api/blocks'

export function useTrainingBlocks(userId: string | undefined) {
  return useQuery({
    queryKey: trainingBlocksQueryKey(userId ?? ''),
    enabled: Boolean(userId),
    queryFn: fetchTrainingBlocks,
  })
}

export function useBlockSummary(
  userId: string | undefined,
  blockId: string | undefined,
) {
  return useQuery({
    queryKey: blockSummaryQueryKey(userId ?? '', blockId ?? ''),
    enabled: Boolean(userId) && Boolean(blockId),
    queryFn: () => fetchBlockSummary(blockId!),
  })
}

export function useBlockComparison(
  userId: string | undefined,
  blockA: string | undefined,
  blockB: string | undefined,
) {
  return useQuery({
    queryKey: ['blockComparison', userId, blockA, blockB],
    enabled: Boolean(userId) && Boolean(blockA) && Boolean(blockB) && blockA !== blockB,
    queryFn: () => fetchBlockComparison(blockA!, blockB!),
  })
}

export function useStartTrainingBlock(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: startTrainingBlock,
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: trainingBlocksQueryKey(userId),
        })
      }
    },
  })
}

export function useEndTrainingBlock(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: endTrainingBlock,
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: trainingBlocksQueryKey(userId),
        })
      }
    },
  })
}
