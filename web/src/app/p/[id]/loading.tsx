import { Page, Skeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-line bg-panel h-12" />
      <Page width="narrow" className="grid gap-4">
        <Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-4/5" />
        <div className="mt-2 rounded-2xl border border-line bg-panel shadow-card p-5 grid gap-5">
          {Array.from({ length: 7 }, (_, i) => <div key={i} className="flex gap-4"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 flex-1" /></div>)}
        </div>
      </Page>
    </div>
  );
}
