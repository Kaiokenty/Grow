import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useWeeklySummaryNlg } from '@/hooks/useMuscleAnalytics'

type WeeklySummaryCardProps = {
  userId: string
  weekStartDay: number
}

export function WeeklySummaryCard({
  userId,
  weekStartDay,
}: WeeklySummaryCardProps) {
  const { data, isLoading } = useWeeklySummaryNlg(userId, weekStartDay)

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">Weekly summary</CardTitle>
        <CardDescription>Plain-language training readout</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
        ) : data && data.lines.length > 0 ? (
          <ul className="space-y-1.5 text-sm">
            {data.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Log more sessions to generate weekly insights.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
