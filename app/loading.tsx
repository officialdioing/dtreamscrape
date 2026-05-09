import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-5rem)] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl items-center justify-center">
        <Card className="w-full overflow-hidden border border-border/70 bg-card/95 shadow-[0_18px_54px_rgba(64,21,63,0.08)] backdrop-blur">
          <CardContent className="space-y-8 p-8 sm:p-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background px-5 py-3 shadow-[0_10px_30px_rgba(64,21,63,0.05)]">
                <Spinner className="size-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Loading Dreamscape…
                </span>
              </div>
              <div className="max-w-2xl space-y-2">
                <div className="h-8 w-64 rounded-full bg-muted/80 animate-pulse mx-auto" />
                <div className="h-4 w-96 max-w-full rounded-full bg-muted/60 animate-pulse mx-auto" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border/70 bg-background p-5 shadow-[0_10px_30px_rgba(64,21,63,0.04)]"
                >
                  <div className="h-4 w-24 rounded-full bg-muted/80 animate-pulse" />
                  <div className="mt-4 h-8 w-16 rounded-full bg-muted animate-pulse" />
                  <div className="mt-4 h-3 w-28 rounded-full bg-muted/60 animate-pulse" />
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-border/70 bg-background p-6 shadow-[0_10px_30px_rgba(64,21,63,0.04)]">
                <div className="h-5 w-40 rounded-full bg-muted/80 animate-pulse" />
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-14 rounded-xl bg-muted/60 animate-pulse" />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background p-6 shadow-[0_10px_30px_rgba(64,21,63,0.04)]">
                <div className="h-5 w-32 rounded-full bg-muted/80 animate-pulse" />
                <div className="mt-5 space-y-4">
                  <div className="h-24 rounded-2xl bg-muted/60 animate-pulse" />
                  <div className="h-24 rounded-2xl bg-muted/60 animate-pulse" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
