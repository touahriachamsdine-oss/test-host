export type GridPreset = 'ledger' | 'stats' | 'domains' | 'cards' | 'units' | 'directory';

export type GridColumns = {
  mobile: number;
  tablet: number;
  desktop: number;
  xl: number;
};

export type BreakpointTier = 'mobile' | 'tablet' | 'desktop' | 'xl';

export const GRID_PRESETS: Record<GridPreset, GridColumns> = {
  ledger: { mobile: 2, tablet: 4, desktop: 6, xl: 8 },
  stats: { mobile: 2, tablet: 4, desktop: 4, xl: 4 },
  domains: { mobile: 2, tablet: 3, desktop: 4, xl: 6 },
  units: { mobile: 1, tablet: 2, desktop: 3, xl: 3 },
  cards: { mobile: 1, tablet: 2, desktop: 3, xl: 3 },
  directory: { mobile: 1, tablet: 2, desktop: 3, xl: 4 },
};

export const BREAKPOINT_TIERS: Array<{ min: number; tier: BreakpointTier }> = [
  { min: 1280, tier: 'xl' },
  { min: 1024, tier: 'desktop' },
  { min: 640, tier: 'tablet' },
  { min: 0, tier: 'mobile' },
];

export function gridSpec(_viewport: number, preset: GridPreset): GridColumns {
  return GRID_PRESETS[preset];
}

export function columnTier(viewport: number): BreakpointTier {
  for (const { min, tier } of BREAKPOINT_TIERS) {
    if (viewport >= min) return tier;
  }
  return 'mobile';
}

export function columnsFor(spec: GridColumns, viewport: number): number {
  return spec[columnTier(viewport)];
}

export function gridClass(preset: GridPreset, _viewport: number): string {
  const spec = gridSpec(_viewport, preset);
  return `grid-cols-${spec.mobile} sm:grid-cols-${spec.tablet} md:grid-cols-${spec.desktop} xl:grid-cols-${spec.xl}`;
}