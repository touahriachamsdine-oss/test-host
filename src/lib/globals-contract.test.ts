import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(process.cwd(), 'src/globals.css'), 'utf8');

describe('globals.css premium design contract', () => {
  it('defines the per-palette glass tokens', () => {
    expect(css).toContain('--glass-bg:');
    expect(css).toContain('--glass-border:');
    expect(css).toContain('--ring-glow:');
  });

  it('resolves ring-glow against the runtime signal token', () => {
    expect(css.match(/--ring-glow:[^;]*var\(--signal\)/g)).toHaveLength(3);
    expect(css).not.toContain('--ring-glow: 0 0 0 1px var(--color-signal)');
  });

  it('defines the glass, ring, tile and grid primitives', () => {
    for (const selector of [
      '.field-glass',
      '.panel-glass',
      '.ring-focus',
      '.tile-hover',
      '.grid-guard',
    ]) {
      expect(css).toContain(selector);
    }
  });

  it('degrades to a solid surface when backdrop-filter is unsupported', () => {
    const supportsIdx = css.search(
      /@supports\s+not\s+\(\(?(?:-webkit-)?backdrop-filter/,
    );
    expect(supportsIdx).toBeGreaterThan(-1);
    const block = css.slice(supportsIdx);
    expect(block).toMatch(/\{\s*\.field-glass/);
  });

  it('gates tile-hover hover interactivity behind reduced-motion preference', () => {
    const tail = css.slice(
      css.lastIndexOf('@media (prefers-reduced-motion: no-preference)'),
    );
    expect(tail).toMatch(/\.tile-hover:hover/);
  });
});