#!/usr/bin/env node
// Turns the Vite build in dist/ into react-host-app.zip:
// writes react-host.json and icon.png into dist/, then packs and validates the directory.
//
// Overrides (e.g. a second copy with the same storage keys for isolation tests):
//   RH_APP_ID, RH_APP_NAME, RH_ICON_COLOR (#rrggbb), RH_APP_VERSION (defaults to package.json)
// Extra arguments go to react-host/pack.mjs, e.g. `--tag-from-env` in CI.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { appIcon } from '../react-host/lib/png.mjs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (!existsSync('dist/index.html')) throw new Error('dist/ is missing: run `npm run build` first');

const manifest = {
  schemaVersion: 1,
  appId: process.env.RH_APP_ID ?? 'dev.yevhen.quicknotes',
  name: process.env.RH_APP_NAME ?? 'Quick Notes',
  version: process.env.RH_APP_VERSION ?? pkg.version,
  description: 'Локальні нотатки',
  entry: 'index.html',
  icon: 'icon.png',
  minHostVersion: '0.1.0',
};
const hex = (process.env.RH_ICON_COLOR ?? '#2563eb').replace('#', '');
const color = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));

writeFileSync('dist/react-host.json', JSON.stringify(manifest, null, 2) + '\n');
writeFileSync('dist/icon.png', appIcon(192, color));
execFileSync(process.execPath, ['react-host/pack.mjs', 'dist', '--out', 'react-host-app.zip', ...process.argv.slice(2)], { stdio: 'inherit' });
