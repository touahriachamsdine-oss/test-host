import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { gridClass } from '../lib/layout';
import { StatsStrip, type StatsItem } from './StatsStrip';

const ITEMS: StatsItem[] = [
  { label: 'Registered references', value: '1 234' },
  { label: 'Domains', value: '6' },
  { label: 'Teams', value: '48' },
  { label: 'Edition', value: 'DZ / DT / 2026' }
];

const VIEWPORTS = [375, 1280];

afterEach(() => cleanup());

describe('StatsStrip', () => {
  it('renders one tile per item with each label and value visible', () => {
    render(<StatsStrip items={ITEMS} />);
    const tiles = screen.getAllByRole('listitem');
    expect(tiles).toHaveLength(ITEMS.length);
    for (const item of ITEMS) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
      expect(screen.getByText(item.value)).toBeInTheDocument();
    }
  });

  it('sources the grid classes from the density contract for a couple of viewports', () => {
    for (const viewport of VIEWPORTS) {
      const { unmount } = render(<StatsStrip items={ITEMS} viewport={viewport} />);
      const grid = screen.getByRole('list');
      for (const cls of gridClass('stats', viewport).split(' ')) {
        expect(grid).toHaveClass(cls);
      }
      unmount();
    }
  });

  it('sets the --n stagger style variable per tile', () => {
    render(<StatsStrip items={ITEMS} />);
    screen.getAllByRole('listitem').forEach((tile, i) => {
      expect(tile).toHaveAttribute('style', expect.stringContaining(`--n: ${i}`));
    });
  });
});