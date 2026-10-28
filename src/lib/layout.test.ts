import { describe, it, expect } from 'vitest';
import {
  gridSpec,
  columnsFor,
  gridClass,
  BREAKPOINT_TIERS,
  type BreakpointTier
} from '@/lib/layout';

const VIEWPORTS = [320, 375, 480, 640, 768, 1024, 1280, 1440];

const TIER_EXPECTED: Record<BreakpointTier, number> = {
  mobile: 375,
  tablet: 640,
  desktop: 1024,
  xl: 1280
};

describe('responsive density contract', () => {
  it('ledger preset is monotonic non-decreasing across viewports', () => {
    const prev = { mobile: 0, tablet: 0, desktop: 0, xl: 0 };
    for (const vp of VIEWPORTS) {
      const spec = gridSpec(vp, 'ledger');
      const cols = columnsFor(spec, vp);
      expect(cols).toBeGreaterThanOrEqual(Math.max(prev.mobile, prev.tablet, prev.desktop, prev.xl));
      if (vp < 640) prev.mobile = cols;
      else if (vp < 1024) prev.tablet = cols;
      else if (vp < 1280) prev.desktop = cols;
      else prev.xl = cols;
    }
  });

  it('ledger: 2 cols at 375, 4 at 640, 6 at 1024, 8 at 1280', () => {
    expect(columnsFor(gridSpec(375, 'ledger'), 375)).toBe(2);
    expect(columnsFor(gridSpec(640, 'ledger'), 640)).toBe(4);
    expect(columnsFor(gridSpec(1024, 'ledger'), 1024)).toBe(6);
    expect(columnsFor(gridSpec(1280, 'ledger'), 1280)).toBe(8);
  });

  it('stats: 2 cols at 375, 4 at 640 and up', () => {
    expect(columnsFor(gridSpec(375, 'stats'), 375)).toBe(2);
    expect(columnsFor(gridSpec(640, 'stats'), 640)).toBe(4);
    expect(columnsFor(gridSpec(1440, 'stats'), 1440)).toBe(4);
  });

  it('domains: 2/3/4/6 across tiers', () => {
    expect(columnsFor(gridSpec(375, 'domains'), 375)).toBe(2);
    expect(columnsFor(gridSpec(640, 'domains'), 640)).toBe(3);
    expect(columnsFor(gridSpec(1024, 'domains'), 1024)).toBe(4);
    expect(columnsFor(gridSpec(1280, 'domains'), 1280)).toBe(6);
  });

  it('directory: 1/2/3/4 across tiers', () => {
    expect(columnsFor(gridSpec(375, 'directory'), 375)).toBe(1);
    expect(columnsFor(gridSpec(640, 'directory'), 640)).toBe(2);
    expect(columnsFor(gridSpec(1024, 'directory'), 1024)).toBe(3);
    expect(columnsFor(gridSpec(1280, 'directory'), 1280)).toBe(4);
  });

  it('units: 1/2/3/3 across tiers', () => {
    expect(columnsFor(gridSpec(375, 'units'), 375)).toBe(1);
    expect(columnsFor(gridSpec(640, 'units'), 640)).toBe(2);
    expect(columnsFor(gridSpec(1024, 'units'), 1024)).toBe(3);
    expect(columnsFor(gridSpec(1280, 'units'), 1280)).toBe(3);
  });

  it('cards: never collapses below 1; 1/2/3/3', () => {
    expect(columnsFor(gridSpec(320, 'cards'), 320)).toBe(1);
    expect(columnsFor(gridSpec(375, 'cards'), 375)).toBe(1);
    expect(columnsFor(gridSpec(640, 'cards'), 640)).toBe(2);
    expect(columnsFor(gridSpec(1024, 'cards'), 1024)).toBe(3);
    expect(columnsFor(gridSpec(1280, 'cards'), 1280)).toBe(3);
  });
});

describe('gridClass emits Tailwind grid utilities per preset and viewport', () => {
  it('ledger: grid-cols-2 / sm:grid-cols-4 / md:grid-cols-6 / xl:grid-cols-8', () => {
    expect(gridClass('ledger', 375)).toContain('grid-cols-2');
    expect(gridClass('ledger', 640)).toContain('sm:grid-cols-4');
    expect(gridClass('ledger', 1024)).toContain('md:grid-cols-6');
    expect(gridClass('ledger', 1280)).toContain('xl:grid-cols-8');
  });

  it('stats: grid-cols-2 / sm:grid-cols-4 / xl:grid-cols-4', () => {
    expect(gridClass('stats', 375)).toContain('grid-cols-2');
    expect(gridClass('stats', 640)).toContain('sm:grid-cols-4');
    expect(gridClass('stats', 1440)).toContain('xl:grid-cols-4');
  });

  it('domains: 2/3/4/6 across tiers', () => {
    expect(gridClass('domains', 375)).toContain('grid-cols-2');
    expect(gridClass('domains', 640)).toContain('sm:grid-cols-3');
    expect(gridClass('domains', 1024)).toContain('md:grid-cols-4');
    expect(gridClass('domains', 1280)).toContain('xl:grid-cols-6');
  });

  it('cards: grid-cols-1 / sm:grid-cols-2 / md:grid-cols-3 / xl:grid-cols-3', () => {
    expect(gridClass('cards', 320)).toContain('grid-cols-1');
    expect(gridClass('cards', 640)).toContain('sm:grid-cols-2');
    expect(gridClass('cards', 1024)).toContain('md:grid-cols-3');
    expect(gridClass('cards', 1280)).toContain('xl:grid-cols-3');
  });
});

describe('exact contract tier values per BreakpointTier', () => {
  it('ledger data tables: 2/4/6/8 at mobile/tablet/desktop/xl', () => {
    for (const { tier } of BREAKPOINT_TIERS) {
      const vp = TIER_EXPECTED[tier];
      const expected: Record<BreakpointTier, number> = {
        mobile: 2,
        tablet: 4,
        desktop: 6,
        xl: 8
      };
      const spec = gridSpec(vp, 'ledger');
      expect(columnsFor(spec, vp)).toBe(expected[tier]);
      expect(gridClass('ledger', vp)).toContain(`grid-cols-${expected[tier]}`);
    }
  });

  it('domains dept explorer: 2/3/4/6 at mobile/tablet/desktop/xl', () => {
    for (const { tier } of BREAKPOINT_TIERS) {
      const vp = TIER_EXPECTED[tier];
      const expected: Record<BreakpointTier, number> = {
        mobile: 2,
        tablet: 3,
        desktop: 4,
        xl: 6
      };
      const spec = gridSpec(vp, 'domains');
      expect(columnsFor(spec, vp)).toBe(expected[tier]);
      expect(gridClass('domains', vp)).toContain(`grid-cols-${expected[tier]}`);
    }
  });
});