import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode
} from 'react';
import { gridClass, type GridPreset } from '@/lib/layout';

export function InsightsGrid({
  children,
  preset = 'ledger',
  viewport = 1280,
  className
}: {
  children: ReactNode;
  preset?: GridPreset;
  viewport?: number;
  className?: string;
}) {
  const guarded = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const element = child as ReactElement<{ className?: string }>;
    return cloneElement(element, {
      className: `${element.props.className ?? ''} grid-guard`
    });
  });

  return (
    <div
      role="list"
      className={`rise-in grid grid-guard gap-2 ${gridClass(preset, viewport)} ${className ?? ''}`}
    >
      {guarded}
    </div>
  );
}