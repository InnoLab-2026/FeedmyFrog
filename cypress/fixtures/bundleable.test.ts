import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * A spec, and everything it imports, has to compile for the browser.
 *
 * Cypress bundles spec files with webpack and runs them in the browser, so a
 * Node built-in anywhere in a spec's import graph is fatal -- not to that
 * assertion, to the entire file, at compile time, before a single test runs.
 * This is what that looks like:
 *
 *   Module build failed: UnhandledSchemeError: Reading from "node:crypto"
 *   is not handled by plugins (Unhandled scheme).
 *
 * It happened here: the fixtures module derived the seeded user's id with
 * `createHash`, one import away from a spec, and cost a full CI cycle to find
 * because nothing local catches it -- `tsc` is happy, and the unit suite runs
 * in Node where `node:crypto` resolves fine.
 *
 * So: walk what the specs actually import and fail here instead, in a second.
 * The Node-only half of the fixtures lives in e2e-user.ts, which the config
 * and the seed script import and no spec may.
 */

const SPEC_DIR = resolve(__dirname, '../e2e');

/** `import ... from 'x'`, `export ... from 'x'`, and `require('x')`. */
const IMPORT_RE =
  /(?:from\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;

/** Strips comments, so prose about node:crypto is not mistaken for an import. */
function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function importsOf(file: string): string[] {
  const source = withoutComments(readFileSync(file, 'utf8'));
  return [...source.matchAll(IMPORT_RE)].map((m) => m[1]);
}

/** Every local module a spec pulls in, transitively. */
function reachableFrom(entry: string, seen = new Set<string>()): string[] {
  if (seen.has(entry)) return [];
  seen.add(entry);

  for (const specifier of importsOf(entry)) {
    if (!specifier.startsWith('.')) continue;

    const base = resolve(dirname(entry), specifier);
    for (const candidate of [`${base}.ts`, `${base}/index.ts`, base]) {
      try {
        readFileSync(candidate, 'utf8');
        reachableFrom(candidate, seen);
        break;
      } catch {
        // Not this extension; try the next.
      }
    }
  }

  return [...seen];
}

const specs = readdirSync(SPEC_DIR)
  .filter((name) => name.endsWith('.cy.ts'))
  .map((name) => resolve(SPEC_DIR, name));

describe('cypress specs bundle for the browser', () => {
  it('finds at least one spec, so this test cannot pass vacuously', () => {
    expect(specs.length).toBeGreaterThan(0);
  });

  it.each(specs)('%s imports nothing that needs Node', (spec) => {
    const offenders: string[] = [];

    for (const file of reachableFrom(spec)) {
      for (const specifier of importsOf(file)) {
        if (specifier.startsWith('node:')) {
          offenders.push(`${file.replace(process.cwd() + '/', '')} → ${specifier}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
