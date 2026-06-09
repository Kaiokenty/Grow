import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useUserSettings } from '@/hooks/useUserSettings'
import { formatTonnage } from '@/lib/units'
import {
  useBlockComparison,
  useBlockSummary,
  useEndTrainingBlock,
  useStartTrainingBlock,
  useTrainingBlocks,
} from '@/hooks/useTrainingBlocks'
import { formatWorkoutDate } from '@/lib/dates'
import { todayIsoDate } from '@/lib/workout/types'

function formatBlockRange(start: string, end: string | null) {
  if (!end) return `${formatWorkoutDate(start)} → active`
  return `${formatWorkoutDate(start)} → ${formatWorkoutDate(end)}`
}

export function BlocksPage() {
  const { user } = useAuth()
  const { data: settings } = useUserSettings(user?.id)
  const displayUnit = settings?.display_unit ?? 'kg'
  const { data: blocks = [], isLoading, error } = useTrainingBlocks(user?.id)
  const startBlock = useStartTrainingBlock(user?.id)
  const endBlock = useEndTrainingBlock(user?.id)

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(todayIsoDate())
  const [notes, setNotes] = useState('')
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [compareA, setCompareA] = useState('')
  const [compareB, setCompareB] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const activeBlock = useMemo(
    () => blocks.find((block) => block.is_active),
    [blocks],
  )
  const endedBlocks = useMemo(
    () => blocks.filter((block) => !block.is_active),
    [blocks],
  )

  const { data: summary } = useBlockSummary(user?.id, selectedBlockId ?? undefined)
  const { data: comparison } = useBlockComparison(
    user?.id,
    compareA || undefined,
    compareB || undefined,
  )

  const handleStart = async () => {
    setFormError(null)
    if (!name.trim()) {
      setFormError('Block name required')
      return
    }
    try {
      await startBlock.mutateAsync({
        name: name.trim(),
        start_date: startDate,
        notes: notes.trim() || null,
      })
      setName('')
      setNotes('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to start block')
    }
  }

  const handleEnd = async (blockId: string) => {
    setFormError(null)
    try {
      await endBlock.mutateAsync(blockId)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to end block')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training blocks"
        description="Date-range mesocycles. Workouts auto-include by workout date."
      />

      {isLoading && <PageSkeleton rows={4} />}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error instanceof Error ? error.message : 'Failed to load blocks'}
        </p>
      )}
      {formError && (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      )}

      {!isLoading && activeBlock && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active block</CardTitle>
            <CardDescription>{formatBlockRange(activeBlock.start_date, activeBlock.end_date)}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{activeBlock.name}</p>
              {activeBlock.notes && (
                <p className="text-sm text-muted-foreground">{activeBlock.notes}</p>
              )}
            </div>
            <Button
              variant="secondary"
              onClick={() => void handleEnd(activeBlock.id)}
              loading={endBlock.isPending}
            >
              End block
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !activeBlock && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Start block</CardTitle>
            <CardDescription>One active block at a time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="block-name">Name</Label>
                <Input
                  id="block-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Hypertrophy 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-start">Start date</Label>
                <Input
                  id="block-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="block-notes">Notes</Label>
              <Input
                id="block-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional focus"
              />
            </div>
            <Button onClick={() => void handleStart()} loading={startBlock.isPending}>
              Start block
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Past blocks</CardTitle>
          <CardDescription>Select a block for summary stats.</CardDescription>
        </CardHeader>
        <CardContent>
          {endedBlocks.length === 0 ? (
            <EmptyState
              title="No completed blocks"
              description="End an active block to see history here."
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {endedBlocks.map((block) => (
                <li key={block.id} className="flex items-center justify-between gap-4 py-3">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    <p className="text-sm font-medium">{block.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBlockRange(block.start_date, block.end_date)}
                    </p>
                  </button>
                  <Button
                    size="sm"
                    variant={selectedBlockId === block.id ? 'primary' : 'secondary'}
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    Summary
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{summary.name}</CardTitle>
            <CardDescription>
              {formatBlockRange(summary.start_date, summary.end_date)}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Tonnage" value={formatTonnage(summary.tonnage, displayUnit)} />
            <Stat label="Working sets" value={String(summary.total_sets)} />
            <Stat label="Avg RPE" value={summary.avg_rpe != null ? String(summary.avg_rpe) : '—'} />
            <Stat label="PRs" value={String(summary.pr_count)} />
          </CardContent>
          {summary.top_exercises.length > 0 && (
            <CardContent className="border-t border-border/60 pt-4">
              <p className="mb-2 text-sm font-medium">Top exercises</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {summary.top_exercises.map((row) => (
                  <li key={row.name}>
                    {row.name} · {formatTonnage(row.tonnage, displayUnit)} · {row.sets} sets
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      )}

      {endedBlocks.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compare blocks</CardTitle>
            <CardDescription>Volume and RPE deltas between two ended blocks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="compare-a">Block A</Label>
                <select
                  id="compare-a"
                  value={compareA}
                  onChange={(e) => setCompareA(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                >
                  <option value="">Select…</option>
                  {endedBlocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="compare-b">Block B</Label>
                <select
                  id="compare-b"
                  value={compareB}
                  onChange={(e) => setCompareB(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                >
                  <option value="">Select…</option>
                  {endedBlocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {comparison && (
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <Stat
                  label="Volume change (B vs A)"
                  value={
                    comparison.volume_pct_delta != null
                      ? `${comparison.volume_pct_delta > 0 ? '+' : ''}${comparison.volume_pct_delta}%`
                      : '—'
                  }
                />
                <Stat
                  label="Avg RPE delta"
                  value={
                    comparison.avg_rpe_delta != null
                      ? `${comparison.avg_rpe_delta > 0 ? '+' : ''}${comparison.avg_rpe_delta}`
                      : '—'
                  }
                />
                <Stat
                  label="PRs"
                  value={`${comparison.block_a.pr_count} → ${comparison.block_b.pr_count}`}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}
