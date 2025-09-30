import { build } from 'esbuild';
import alias from 'esbuild-plugin-alias';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: ['netlify/functions/api.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outdir: 'netlify/functions',
  external: ['@neondatabase/serverless', 'express'],
  plugins: [
    alias({
      '@shared': path.resolve(__dirname, '../shared'),
    }),
  ],
}).catch(() => process.exit(1));

console.log('✓ Functions built successfully');
