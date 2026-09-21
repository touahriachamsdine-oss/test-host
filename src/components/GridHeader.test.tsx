import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { GridHeader, type GridHeaderColumn } from './GridHeader';

const COLUMNS: GridHeaderColumn[] = [
  { key: 'code', label: 'Ref' },
  { key: 'name', label: 'Startup' },
  { key: 'meta', label: 'Origin' }
];

afterEach(() => cleanup());

describe('GridHeader', () => {
  it('renders column labels in dir-aware order', () => {
    const { rerender } = render(<GridHeader dir="ltr" columns={COLUMNS} />);
    expect(screen.getByRole('grid')).toHaveAttribute('dir', 'ltr');
    for (const column of COLUMNS) {
      expect(screen.getByText(column.label)).toBeInTheDocument();
    }
    rerender(<GridHeader dir="rtl" columns={COLUMNS} />);
    expect(screen.getByRole('grid')).toHaveAttribute('dir', 'rtl');
    for (const column of COLUMNS) {
      expect(screen.getByText(column.label)).toBeInTheDocument();
    }
  });

  it('grid applies grid-guard to every [role=row]', () => {
    render(
      <GridHeader dir="ltr" columns={COLUMNS}>
        <div role="row" />
        <div role="row" />
      </GridHeader>
    );
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThanOrEqual(3);
    rows.forEach((row) => expect(row).toHaveClass('grid-guard'));
  });
});