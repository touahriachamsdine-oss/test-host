export type StartupStatus = 'verified' | 'pending' | 'rejected';
export type StartupPriority = 'A' | 'B' | 'C';

export interface Startup {
  id: string;
  name: string;
  country: string;
  domain: string;
  subDomain?: string;
  shortDescription: string;
  technology: string;
  yearFounded: number;
  officialSite?: string;
  sourceUrl?: string;
  whyRelevant: string;
  priority: StartupPriority;
  status: StartupStatus;
  refNo?: number;
}

export const STARTUPS: Startup[] = [
  {
    id: 'kabas-ai',
    name: 'KABAS AI',
    country: 'Algeria',
    domain: 'ai-computing',
    subDomain: 'Generative AI',
    shortDescription:
      'A sovereign Arabic large language model trained on-premises for government and enterprise use.',
    technology: 'LLM fine-tuning, RAG, on-prem inference',
    yearFounded: 2024,
    officialSite: 'https://kabas.ai',
    sourceUrl: 'https://www.researchgate.net',
    whyRelevant:
      'Addresses digital sovereignty and Arabic NLP gaps with a foundation model built in Algeria.',
    priority: 'A',
    status: 'verified'
  },
  {
    id: 'yassirt-robotics',
    name: 'Yassirt Robotics',
    country: 'Algeria',
    domain: 'robotics',
    subDomain: 'Industrial robotics',
    shortDescription:
      'Cobot arms and vision systems automating assembly lines in North African factories.',
    technology: 'Computer vision, PLC integration, ROS2',
    yearFounded: 2021,
    officialSite: 'https://www.yassirt.com',
    whyRelevant:
      'Boosts local manufacturing competitiveness by making industrial automation affordable.',
    priority: 'B',
    status: 'verified'
  },
  {
    id: 'dz-biomark',
    name: 'DZ BioMark',
    country: 'Algeria',
    domain: 'biotech-healthtech',
    subDomain: 'Diagnostics',
    shortDescription:
      'Low-cost molecular diagnostics kits for infectious diseases adapted to desert logistics.',
    technology: 'CRISPR-based detection, lyophilized reagents',
    yearFounded: 2020,
    officialSite: 'https://www.dzbiomark.dz',
    whyRelevant:
      'Brings rapid diagnostics to remote regions, cutting sample transport time by days.',
    priority: 'A',
    status: 'verified'
  },
  {
    id: 'sahara-drones',
    name: 'Sahara Sky Drones',
    country: 'Algeria',
    domain: 'drones-autonomy',
    subDomain: 'Agricultural drones',
    shortDescription:
      'Autonomous drone swarm for precision agriculture over large Saharan-adjacent farms.',
    technology: 'Autonomous swarming, NDVI imaging, solar charging',
    yearFounded: 2022,
    officialSite: 'https://www.sahara-sky-drones.dz',
    sourceUrl: 'https://www.univ-ouargla.dz',
    whyRelevant:
      'Optimizes water and fertilizer use in arid agriculture, directly supporting food security.',
    priority: 'B',
    status: 'verified'
  },
  {
    id: 'maghreb-storage',
    name: 'Maghreb Storage Solutions',
    country: 'Algeria',
    domain: 'energy-storage',
    subDomain: 'Battery storage',
    shortDescription:
      'Utility-scale battery energy storage systems balancing solar intermittency.',
    technology: 'LFP BESS, smart inverters, EMS software',
    yearFounded: 2023,
    officialSite: 'https://www.maghreb-storage.dz',
    whyRelevant:
      'Unlocks Algeria’s solar potential by solving the grid-storage bottleneck.',
    priority: 'A',
    status: 'verified'
  },
  {
    id: 'atlas-space',
    name: 'Atlas Spaceworks',
    country: 'Algeria',
    domain: 'space-aerospace',
    subDomain: 'CubeSats & ground stations',
    shortDescription:
      'CubeSat platforms and low-cost ground station networks for African earth observation.',
    technology: 'CubeSat bus, S-band ground stations, telemetry software',
    yearFounded: 2022,
    officialSite: 'https://www.atlas-spaceworks.io',
    sourceUrl: 'https://asa.dz',
    whyRelevant:
      'Builds sovereign space capacity for monitoring agriculture and water across North Africa.',
    priority: 'B',
    status: 'verified'
  },
  {
    id: 'aures-medic',
    name: 'Aurès MedTech',
    country: 'Algeria',
    domain: 'medtech',
    subDomain: 'Medical devices',
    shortDescription:
      'Affordable AI-assisted vital-sign monitors for rural clinics.',
    technology: 'Embedded ML, low-power hardware, telehealth APIs',
    yearFounded: 2020,
    officialSite: 'https://www.aures-medic.com',
    whyRelevant:
      'Reduces reliance on imported medical devices and improves rural care access.',
    priority: 'A',
    status: 'verified'
  },
  {
    id: 'cybershield-dz',
    name: 'CyberShield DZ',
    country: 'Algeria',
    domain: 'cybersecurity',
    subDomain: 'Security operations',
    shortDescription:
      'Managed detection & response platform tailored to Algerian SMEs and the public sector.',
    technology: 'SIEM, EDR, AI-driven threat correlation',
    yearFounded: 2019,
    officialSite: 'https://www.cybershield-dz.dz',
    whyRelevant:
      'Closes a critical gap in national cyber resilience for critical infrastructure.',
    priority: 'A',
    status: 'verified'
  },
  {
    id: 'aurion-semi',
    name: 'Aurion Semiconductors',
    country: 'Algeria',
    domain: 'semiconductors',
    subDomain: 'Power management ICs',
    shortDescription:
      'Design house for power-management ICs targeting LDO regulators in 130nm.',
    technology: 'Analog IC design, 130nm PDK, silicon validation',
    yearFounded: 2023,
    officialSite: 'https://www.aurion-semi.com',
    whyRelevant:
      'Builds foundational IC design capability in a region without domestic fabs.',
    priority: 'C',
    status: 'pending'
  },
  {
    id: 'graphene-dz',
    name: 'GrapheneDZ',
    country: 'Algeria',
    domain: 'nanotech-materials',
    subDomain: 'Graphene membranes',
    shortDescription: 'Graphene-enhanced membranes for water desalination.',
    technology: 'CVD graphene, membrane coating',
    yearFounded: 2019,
    officialSite: 'https://www.graphene-dz.com',
    whyRelevant:
      'Turns abundant local hydrocarbon feedstock into high-value advanced materials.',
    priority: 'C',
    status: 'rejected'
  }
];

export function getVerifiedStartups(): Startup[] {
  return STARTUPS.filter((s) => s.status === 'verified');
}

export function getStartupById(id: string): Startup | undefined {
  return STARTUPS.find((s) => s.id === id);
}

export function getVerifiedById(id: string): Startup | undefined {
  return getVerifiedStartups().find((s) => s.id === id);
}

export function getVerifiedByDomain(domain: string): Startup[] {
  return getVerifiedStartups().filter((s) => s.domain === domain);
}

export function searchVerifiedStartups(query?: string, domain?: string): Startup[] {
  let results = getVerifiedStartups();
  if (domain && domain !== 'all') {
    results = results.filter((s) => s.domain === domain);
  }
  if (query) {
    const q = query.trim().toLowerCase();
    results = results.filter((s) =>
      [s.name, s.shortDescription, s.technology, s.subDomain ?? '', s.country]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }
  return results;
}