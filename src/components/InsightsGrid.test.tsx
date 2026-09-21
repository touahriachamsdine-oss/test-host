import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { gridClass } from '../lib/layout';
import { InsightsGrid } from './InsightsGrid';
import { InsightTile } from './InsightTile';

afterEach(() => cleanup());

describe('InsightsGrid', () => {
  it('applies the ledger density contract by default', () => {
    const { rerender } = render(
      <InsightsGrid>
        <InsightTile label="A" value="1" />
      </InsightsGrid>
    );
    for (const cls of gridClass('ledger', 1280).split(' ')) {
      expect(screen.getByRole('list')).toHaveClass(cls);
    }
    rerender(
      <InsightsGrid viewport={375}>
        <InsightTile label="A" value="1" />
      </InsightsGrid>
    );
    for (const cls of gridClass('ledger', 375).split(' ')) {
      expect(screen.getByRole('list')).toHaveClass(cls);
    }
  });

  it('can switch to the cards density preset', () => {
    render(
      <InsightsGrid preset="cards">
        <InsightTile label="A" value="1" />
      </InsightsGrid>
    );
    for (const cls of gridClass('cards', 1280).split(' ')) {
      expect(screen.getByRole('list')).toHaveClass(cls);
    }
  });

  it('keeps every grid child inside a grid-guard wrapper', () => {
    render(
      <InsightsGrid>
        <InsightTile label="A" value="1" />
        <InsightTile label="B" value="2" />
      </InsightsGrid>
    );
    const tiles = screen.getAllByRole('listitem');
    expect(tiles).toHaveLength(2);
    tiles.forEach((tile) => expect(tile).toHaveClass('grid-guard'));
  });

  it('carries the rise-in entrance class for the stagger cascade', () => {
    render(
      <InsightsGrid>
        <InsightTile label="A" value="1" />
      </InsightsGrid>
    );
    expect(screen.getByRole('list')).toHaveClass('rise-in');
  });
});