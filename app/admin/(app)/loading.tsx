import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export default function AdminAppLoading() {
  return (
    <div className="min-h-[calc(100vh-5rem)] p-4 sm:p-6 lg:p-8">
      <Card className="overflow-hidden border-border/70 bg-card p-0 shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
        <CardContent className="space-y-8 p-6 sm:p-8 lg:p-10">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="h-9 w-64 rounded-full bg-muted/80 animate-pulse" />
              <div className="h-4 w-96 max-w-full rounded-full bg-muted/60 animate-pulse" />
            </div>
            <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background px-5 py-3 text-sm text-muted-foreground">
              <Spinner className="size-5 text-primary" />
              Loading page
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border/70 bg-background p-5 shadow-[0_10px_30px_rgba(64,21,63,0.04)]"
              >
                <div className="h-4 w-24 rounded-full bg-muted/80 animate-pulse" />
                <div className="mt-4 h-8 w-16 rounded-full bg-muted animate-pulse" />
                <div className="mt-4 h-3 w-32 rounded-full bg-muted/60 animate-pulse" />
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-border/70 bg-background p-6 shadow-[0_10px_30px_rgba(64,21,63,0.04)]">
              <div className="h-5 w-40 rounded-full bg-muted/80 animate-pulse" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
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
  );
}
