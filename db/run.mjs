import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = join(__dirname, '..', '.env');
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const file = process.argv[2];
const sql = readFileSync(join(__dirname, file), 'utf8');
await client.query(sql);
console.log(`Ran ${file} successfully.`);

await client.end();
