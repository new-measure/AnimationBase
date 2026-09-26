import { catalog, familyCards } from '@/server/catalog';
import { json, handle } from '@/server/http';

// genre stats for the brief page (no films: public screens only get stats)
export const GET = handle(async () => json({ total: catalog().total, categories: catalog().categories, families: familyCards() }));
