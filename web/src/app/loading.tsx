import { Page, Skeleton } from '@/components/ui';
import { CardsSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <Page className="sm:py-16 grid gap-8">
      <div className="grid gap-4 max-w-3xl"><Skeleton className="h-12 w-4/5" /><Skeleton className="h-5 w-3/5" /></div>
      <Skeleton className="h-36 rounded-2xl" />
      <CardsSkeleton n={3} />
    </Page>
  );
}
