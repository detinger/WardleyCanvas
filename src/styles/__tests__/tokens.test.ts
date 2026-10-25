// DES-01 token snapshot: the binding values live in PLAN.md section 4.2. This
// test fails whenever globals.css drifts from them (or the plan changes without
// the stylesheet). Intentional changes need a design ADR (Section 14.4).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../../..');
const plan = readFileSync(path.join(root, 'PLAN.md'), 'utf8');
const css = readFileSync(path.join(root, 'src/app/globals.css'), 'utf8');

type Tokens = Record<string, string>;

function parseDeclarations(block: string): Tokens {
  const out: Tokens = {};
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) out[m[1]] = m[2].replace(/\s+/g, ' ').trim().toLowerCase();
  return out;
}

/** Body of the first rule whose selector list contains `selector`. */
function block(source: string, selector: string, from = 0): string {
  const i = source.indexOf(selector, from);
  if (i < 0) throw new Error(`selector not found: ${selector}`);
  const open = source.indexOf('{', i);
  let depth = 0;
  for (let j = open; j < source.length; j++) {
    if (source[j] === '{') depth++;
    if (source[j] === '}' && --depth === 0) return source.slice(open + 1, j);
  }
  throw new Error('unbalanced braces');
}

const planCss = plan.slice(plan.indexOf('### 4.2 Exact color tokens'), plan.indexOf('### 4.3'));
const binding = {
  light: parseDeclarations(block(planCss, '[data-theme="light"]')),
  dark: parseDeclarations(block(planCss, '[data-theme="dark"]')),
};
const actual = {
  light: parseDeclarations(block(css, '[data-theme="light"]')),
  dark: parseDeclarations(block(css, '[data-theme="dark"]')),
};

describe('design tokens match the binding contract (Section 4.2)', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`${theme} theme`, () => {
      expect(Object.keys(binding[theme]).length).toBeGreaterThan(40);
      const drift = Object.entries(binding[theme])
        .filter(([name, value]) => actual[theme][name] !== value)
        .map(([name, value]) => `${name}: expected ${value}, found ${actual[theme][name] ?? '(missing)'}`);
      expect(drift).toEqual([]);
    });
  }

  it('shared status colours and radii', () => {
    const shared = parseDeclarations(planCss.slice(planCss.lastIndexOf(':root {')));
    const found = parseDeclarations(css);
    for (const [name, value] of Object.entries(shared)) expect(found[name], name).toBe(value);
  });
});
