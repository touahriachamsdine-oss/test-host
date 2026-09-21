import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { gridClass } from '../lib/layout';
import { InsightBreakdown, type InsightBreakdownRow } from './InsightBreakdown';

const ROWS: InsightBreakdownRow[] = [
  { slug: 'ai-computing', code: 'AI', name: 'AI & Advanced Computing', count: 5, share: 0.5 },
  { slug: 'robotics', code: 'RB', name: 'Robotics', count: 3, share: 0.3 },
  { slug: 'space-aerospace', code: 'SP', name: 'SpaceTech & Aerospace', count: 2, share: 0.2 }
];

afterEach(() => cleanup());

describe('InsightBreakdown', () => {
  it('renders one tile per domain with code, name and count', () => {
    render(<InsightBreakdown rows={ROWS} />);
    for (const row of ROWS) {
      expect(screen.getByText(row.code)).toBeInTheDocument();
      expect(screen.getByText(row.name)).toBeInTheDocument();
      expect(screen.getByText(String(row.count))).toBeInTheDocument();
    }
  });

  it('sources the tiles from the cards density contract', () => {
    render(<InsightBreakdown rows={ROWS} />);
    for (const cls of gridClass('cards', 1280).split(' ')) {
      expect(screen.getByRole('list')).toHaveClass(cls);
    }
  });

  it('draws a share bar proportional to each domain share', () => {
    render(<InsightBreakdown rows={ROWS} />);
    const tiles = screen.getAllByRole('listitem');
    expect(tiles).toHaveLength(ROWS.length);
    const bar = tiles[0].querySelector('[data-breakdown-bar]');
    expect(bar).not.toBeNull();
    expect(bar).toHaveAttribute('style', expect.stringContaining('width: 50%'));
  });

  it('sets the --n stagger variable per tile', () => {
    render(<InsightBreakdown rows={ROWS} />);
    screen.getAllByRole('listitem').forEach((tile, i) => {
      expect(tile).toHaveAttribute('style', expect.stringContaining(`--n: ${i}`));
    });
  });

  it('renders an empty board when there are no rows', () => {
    render(<InsightBreakdown rows={[]} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});