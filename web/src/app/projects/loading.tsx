import { Page } from '@/components/ui';
import { CardsSkeleton, HeaderSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return <Page className="grid gap-8"><HeaderSkeleton /><CardsSkeleton /></Page>;
}
