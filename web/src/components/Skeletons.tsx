// Page-shaped placeholders for loading.tsx files, so navigation shows the layout right away.
import { Page, Skeleton } from './ui';

export function CardsSkeleton({ n = 6 }: { n?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-panel shadow-card overflow-hidden">
          <Skeleton className="h-36 rounded-none" />
          <div className="p-4 grid gap-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-1/3" /></div>
        </div>
      ))}
    </div>
  );
}

export function HeaderSkeleton() {
  return <div className="grid gap-3"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-96 max-w-full" /></div>;
}

export function ListPageSkeleton({ width = 'default', rows = 6 }: { width?: 'default' | 'wide'; rows?: number }) {
  return (
    <Page width={width} className="grid gap-8">
      <HeaderSkeleton />
      <div className="rounded-2xl border border-line bg-panel shadow-card divide-y divide-line">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4"><Skeleton className="size-8 rounded-full" /><Skeleton className="h-4 flex-1 max-w-64" /><Skeleton className="ml-auto h-4 w-24" /></div>
        ))}
      </div>
    </Page>
  );
}
