import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { InsightTile } from './InsightTile';

afterEach(() => cleanup());

describe('InsightTile', () => {
  it('renders the label, the value and the note', () => {
    render(<InsightTile label="Verified references" value="1 234" note="+12 this edition" />);
    expect(screen.getByText('Verified references')).toBeInTheDocument();
    expect(screen.getByText('1 234')).toBeInTheDocument();
    expect(screen.getByText('+12 this edition')).toBeInTheDocument();
  });

  it('renders the signal numeral in ltr mono tabular type', () => {
    render(<InsightTile label="Domains" value="15" />);
    const value = screen.getByText('15');
    expect(value).toHaveAttribute('dir', 'ltr');
    expect(value).toHaveClass('font-mono', 'tabular-nums', 'text-signal');
  });

  it('carries the glass backing, tile lift and grid guard on the tile', () => {
    render(<InsightTile label="Teams" value="48" />);
    expect(screen.getByRole('listitem')).toHaveClass(
      'panel-glass',
      'tile-hover',
      'grid-guard'
    );
  });

  it('sets the --n stagger variable from the index prop', () => {
    render(<InsightTile label="Edition" value="DZ / DT / 2026" index={3} />);
    expect(screen.getByRole('listitem')).toHaveAttribute(
      'style',
      expect.stringContaining('--n: 3')
    );
  });

  it('renders the priority marker square for the three tiers', () => {
    const { rerender } = render(<InsightTile label="High" value="2" marker="signal" />);
    const tile = screen.getByRole('listitem');
    const marker = tile.querySelector('span[aria-hidden]');
    expect(marker).not.toBeNull();
    expect(marker).toHaveClass('bg-signal');

    rerender(<InsightTile label="Medium" value="1" marker="gold" />);
    expect(tile.querySelector('span[aria-hidden]')).toHaveClass('bg-flag-gold');

    rerender(<InsightTile label="Standard" value="1" marker="muted" />);
    expect(tile.querySelector('span[aria-hidden]')).toHaveClass('border-ink/50');
  });

  it('omits the marker square when no marker is given', () => {
    render(<InsightTile label="Edition" value="DZ / DT / 2026" />);
    expect(screen.getByRole('listitem').querySelector('span[aria-hidden]')).toBeNull();
  });
});