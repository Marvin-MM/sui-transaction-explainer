import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Initializing database...');

try {
  execSync(`npx tsx ${path.join(__dirname, '000_init_db.ts')}`, {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('Database initialized successfully!');
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}
