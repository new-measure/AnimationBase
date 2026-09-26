// Where things live. The engine is the repo this app sits in (../); each agent run gets its own copy of it.
import { resolve } from 'node:path';

export const WEB_ROOT = process.env.WEB_ROOT || process.cwd();
export const ENGINE_ROOT = process.env.ENGINE_ROOT || resolve(WEB_ROOT, '..');
export const DATA_DIR = resolve(WEB_ROOT, 'data');
export const WORKSPACES = resolve(DATA_DIR, 'workspaces');
export const DB_PATH = resolve(DATA_DIR, 'app.db');
