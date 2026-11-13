import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './config';

mkdirSync(config.dataDir, { recursive: true });
const db = new Database(join(config.dataDir, 'views.sqlite'), { create: true });
db.run('CREATE TABLE IF NOT EXISTS views (key TEXT PRIMARY KEY, count INTEGER NOT NULL)');

const bump = db.query<{ count: number }, [string, number]>(
  'INSERT INTO views (key, count) VALUES (?1, ?2 + 1) ON CONFLICT (key) DO UPDATE SET count = count + 1 RETURNING count',
);

/** Counts one more view and gives back the new count */
export function countView(key: string) {
  return bump.get(key, config.viewsStart)!.count;
}

const read = db.query<{ count: number }, [string]>('SELECT count FROM views WHERE key = ?1');

/** The count as it is, without counting a view: for /stats.json */
export function viewCount(key: string) {
  return read.get(key)?.count ?? config.viewsStart;
}
