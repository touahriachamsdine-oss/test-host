import type { LucideIcon } from 'lucide-react';
import {
  Atom,
  BatteryCharging,
  Bot,
  BrainCircuit,
  CircuitBoard,
  Cloud,
  Dna,
  Droplets,
  Factory,
  Navigation,
  Rocket,
  ShieldCheck,
  Sprout,
  Stethoscope,
  Sparkles
} from 'lucide-react';

export interface Domain {
  slug: string;
  code: string;
  icon: LucideIcon;
}

export const DOMAINS: Domain[] = [
  { slug: 'ai-computing', code: 'AI', icon: BrainCircuit },
  { slug: 'robotics', code: 'RB', icon: Bot },
  { slug: 'biotech-healthtech', code: 'BIO', icon: Dna },
  { slug: 'drones-autonomy', code: 'DR', icon: Navigation },
  { slug: 'nanotech-materials', code: 'NANO', icon: Atom },
  { slug: 'energy-storage', code: 'EN', icon: BatteryCharging },
  { slug: 'space-aerospace', code: 'SP', icon: Rocket },
  { slug: 'agritech-foodtech', code: 'AGRI', icon: Sprout },
  { slug: 'medtech', code: 'MED', icon: Stethoscope },
  { slug: 'semiconductors', code: 'SEMI', icon: CircuitBoard },
  { slug: 'cybersecurity', code: 'CYB', icon: ShieldCheck },
  { slug: 'manufacturing-3d', code: 'MFG', icon: Factory },
  { slug: 'cleantech', code: 'CLEAN', icon: Droplets },
  { slug: 'cloud-iot', code: 'CLOUD', icon: Cloud },
  { slug: 'other-deep-tech', code: 'OTH', icon: Sparkles }
];

export function getDomain(slug: string): Domain | undefined {
  return DOMAINS.find((d) => d.slug === slug);
}