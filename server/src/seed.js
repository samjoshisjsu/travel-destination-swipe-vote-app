import { fileURLToPath } from 'url';
import { resolve } from 'path';
import { all, run } from './db.js';
import { items } from './data/items.js';

export function seed() {
  const row = all('SELECT COUNT(*) AS count FROM items')[0];
  const count = row ? Number(row.count) : 0;

  if (count > 0) {
    console.log(`Database already contains ${count} items — skipping seed.`);
    return;
  }

  for (const item of items) {
    run(
      'INSERT INTO items (id, name, description, image_url) VALUES (?, ?, ?, ?)',
      [item.id, item.name, item.description, item.imageUrl]
    );
  }

  console.log(`Seeded ${items.length} travel destinations.`);
}

// Auto-run when invoked as a script: node src/seed.js
const __filename = fileURLToPath(import.meta.url);
if (resolve(process.argv[1]) === resolve(__filename)) {
  seed();
}
