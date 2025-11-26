/**
 * Clear Cache Script
 * Clears Vite cache and build artifacts
 */

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pathsToClear = [
  join(__dirname, 'dist'),
  join(__dirname, '.vite'),
  join(__dirname, 'node_modules/.vite'),
];

console.log('🧹 Clearing cache...\n');

pathsToClear.forEach((path) => {
  if (existsSync(path)) {
    try {
      rmSync(path, { recursive: true, force: true });
      console.log(`✅ Cleared: ${path}`);
    } catch (error) {
      console.error(`❌ Error clearing ${path}:`, error.message);
    }
  } else {
    console.log(`ℹ️  Not found: ${path}`);
  }
});

console.log('\n✨ Cache cleared! You can now run "npm run dev" fresh.');

