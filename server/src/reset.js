import { existsSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../data/app.db');

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
  console.log('Database removed.');
} else {
  console.log('No database found — nothing to remove.');
}

console.log('Re-seeding...');
execSync('node src/seed.js', {
  stdio: 'inherit',
  cwd: join(__dirname, '..'),
});
console.log('Reset complete.');
