import {
  BookOpen,
  Building2,
  ClipboardList,
  Cpu,
  Handshake,
  HeartHandshake,
  type LucideIcon
} from 'lucide-react';

export type UnitSlug =
  | 'cde'
  | 'business-incubator'
  | 'cati'
  | 'blue-bleu'
  | 'mia'
  | 'student-services';

export interface Unit {
  slug: UnitSlug;
  code: string;
  icon: LucideIcon;
  /** Deep-tech domains whose projects sit under this unit. */
  domains: string[];
}

/**
 * The university ecosystem as described by the faculty: the four support
 * offices, the AI house, and the student support / digital services space.
 * Each unit owns a disjoint set of deep-tech domains so every project has
 * exactly one home.
 */
export const UNITS: Unit[] = [
  {
    slug: 'cde',
    code: 'CDE',
    icon: BookOpen,
    domains: ['other-deep-tech']
  },
  {
    slug: 'business-incubator',
    code: 'INC',
    icon: Building2,
    domains: ['cybersecurity', 'medtech']
  },
  {
    slug: 'cati',
    code: 'CATI',
    icon: ClipboardList,
    domains: ['semiconductors', 'nanotech-materials', 'biotech-healthtech']
  },
  {
    slug: 'blue-bleu',
    code: 'BLUE',
    icon: Handshake,
    domains: [
      'manufacturing-3d',
      'agritech-foodtech',
      'space-aerospace',
      'energy-storage',
      'cleantech',
      'drones-autonomy'
    ]
  },
  {
    slug: 'mia',
    code: 'MIA',
    icon: Cpu,
    domains: ['ai-computing']
  },
  {
    slug: 'student-services',
    code: 'DIG',
    icon: HeartHandshake,
    domains: ['law-social-impact', 'cloud-iot']
  }
];

export function getUnit(slug: string): Unit | undefined {
  return UNITS.find((unit) => unit.slug === slug);
}

/** Sum of the verified counts of the domains owned by a unit. */
export function unitCount(unit: Unit, counts: Record<string, number>): number {
  return unit.domains.reduce((total, domain) => total + (counts[domain] ?? 0), 0);
}
