import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { gridClass } from '@/lib/layout';

export type GridHeaderColumn = {
  key: string;
  label: string;
  className?: string;
};

export function GridHeader({
  columns,
  dir = 'ltr',
  viewport = 1280,
  className,
  children
}: {
  columns: GridHeaderColumn[];
  dir?: string;
  viewport?: number;
  className?: string;
  children?: ReactNode;
}) {
  const rows = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const element = child as ReactElement<{ className?: string }>;
    return cloneElement(element, {
      className: `${element.props.className ?? ''} grid-guard`
    });
  });

  return (
    <div role="grid" dir={dir} className={className}>
      <div
        role="row"
        className={`grid-guard hidden bg-paper/80 px-1 py-2 backdrop-blur-sm shadow-[0_1px_0_0_var(--line)] lg:sticky lg:top-14 lg:z-20 lg:grid ${gridClass('ledger', viewport)}`}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            role="columnheader"
            className={`grid-guard px-1 py-1 text-[11px] font-medium uppercase tracking-wider text-ink/50 ${column.className ?? ''}`}
          >
            {column.label}
          </div>
        ))}
      </div>
      {rows}
    </div>
  );
}