import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import en from '../../messages/en.json';
import fr from '../../messages/fr.json';
import ar from '../../messages/ar.json';
import { AdminNav } from '@/app/admin/AdminNav';

vi.mock('next/link', async () => {
  const React = await import('react');
  return {
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
      React.createElement('a', { href: String(href), ...props }, children)
  };
});

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/dashboard'
}));

vi.mock('next-auth/react', () => ({
  signOut: vi.fn()
}));

function renderAdminNav(locale: 'en' | 'fr', messages: typeof en) {
  return render(
    <AdminNav
      role="admin"
      teamDomain={null}
      userName="Test User"
      locale={locale}
      messages={messages}
    />
  );
}

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.keys(obj).flatMap((key) => {
    const value = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' ? flatten(value as Record<string, unknown>, path) : [path];
  });
}

const PUBLIC_KEYS = [
  'Auth.backHome',
  'Auth.createAccount',
  'Auth.createAccountLong',
  'Auth.emailLabel',
  'Auth.errorEmailTaken',
  'Auth.errorGeneric',
  'Auth.errorInvalidCredentials',
  'Auth.errorRateLimited',
  'Auth.errorWeakPassword',
  'Auth.haveAccount',
  'Auth.loginSubtitle',
  'Auth.loginTitle',
  'Auth.nameLabel',
  'Auth.noAccount',
  'Auth.passwordHint',
  'Auth.passwordLabel',
  'Auth.signIn',
  'Auth.signInAccountAlt',
  'Auth.submit',
  'Auth.submitting',
  'Auth.welcome',
  'Browse.allDomains',
  'Browse.backToHome',
  'Browse.clear',
  'Browse.emptyText',
  'Browse.emptyTitle',
  'Browse.entries',
  'Browse.filterLabel',
  'Browse.results',
  'Browse.searchButton',
  'Browse.searchPlaceholder',
  'Browse.subtitle',
  'Browse.title',
  'DomainValidation.IN_PROGRESS',
  'DomainValidation.REJECTED',
  'DomainValidation.TO_CHECK',
  'DomainValidation.VALIDATED',
  'DomainValidation.label',
  'DomainValidation.tier',
  'Domains.count',
  'Domains.explore',
  'Domains.subtitle',
  'Domains.title',
  'Filters.clear',
  'Filters.close',
  'Filters.country',
  'Filters.emptyText',
  'Filters.emptyTitle',
  'Filters.entries',
  'Filters.from',
  'Filters.indexLabel',
  'Filters.noCountries',
  'Filters.priority',
  'Filters.results',
  'Filters.search',
  'Filters.searchCountries',
  'Filters.showResults',
  'Filters.title',
  'Filters.to',
  'Filters.years',
  'Footer.credit',
  'Footer.exploreTitle',
  'Footer.legalTitle',
  'Footer.policy',
  'Footer.rights',
  'Footer.tagline',
  'Hero.badge',
  'Hero.browseAll',
  'Hero.domainsLabel',
  'Hero.editionLabel',
  'Hero.entriesLabel',
  'Hero.highlight',
  'Hero.publication',
  'Hero.searchButton',
  'Hero.searchPlaceholder',
  'Hero.subtitle',
  'Hero.teamsLabel',
  'Hero.title',
  'HowItWorks.intro',
  'HowItWorks.priority',
  'HowItWorks.title',
  'LangSwitcher.ariaLabel',
  'Metadata.description',
  'Metadata.title',
  'Navbar.brand',
  'Navbar.brandTag',
  'Navbar.browse',
  'Navbar.closeMenu',
  'Navbar.edition',
  'Navbar.home',
  'Navbar.openMenu',
  'Navbar.saved',
  'Navbar.signIn',
  'Navbar.signOut',
  'Navbar.units',
  'NotFound.home',
  'NotFound.text',
  'NotFound.title',
  'Policy.accounts.body',
  'Policy.accounts.title',
  'Policy.contact.body',
  'Policy.contact.credit',
  'Policy.contact.title',
  'Policy.content.body',
  'Policy.content.title',
  'Policy.cookies.body',
  'Policy.cookies.title',
  'Policy.intro',
  'Policy.ip.body',
  'Policy.ip.title',
  'Policy.lastUpdated',
  'Policy.liability.body',
  'Policy.liability.title',
  'Policy.privacy.body',
  'Policy.privacy.title',
  'Policy.title',
  'Policy.usage.body',
  'Policy.usage.title',
  'Priority.A',
  'Priority.B',
  'Priority.C',
  'SaveButton.save',
  'SaveButton.saveAria',
  'SaveButton.saved',
  'SaveButton.savedAria',
  'SaveButton.signInToSave',
  'Saved.browse',
  'Saved.count',
  'Saved.emptyText',
  'Saved.emptyTitle',
  'Saved.remove',
  'Saved.subtitle',
  'Saved.title',
  'StartupCard.countryLabel',
  'StartupCard.domainLabel',
  'StartupCard.similarLabel',
  'StartupCard.verifiedBadge',
  'StartupCard.viewDetails',
  'StartupCard.yearLabel',
  'StartupDetail.algeriaValueLabel',
  'StartupDetail.backToBrowse',
  'StartupDetail.breadcrumbDomain',
  'StartupDetail.breadcrumbHome',
  'StartupDetail.breadcrumbSeparator',
  'StartupDetail.buildApproachLabel',
  'StartupDetail.countryLabel',
  'StartupDetail.difficultyCapital',
  'StartupDetail.difficultyHigh',
  'StartupDetail.difficultyLabel',
  'StartupDetail.difficultyLow',
  'StartupDetail.difficultyMarket',
  'StartupDetail.difficultyMedium',
  'StartupDetail.difficultyRegulatory',
  'StartupDetail.difficultyTech',
  'StartupDetail.domainLabel',
  'StartupDetail.fixLabel',
  'StartupDetail.generatedNoteLabel',
  'StartupDetail.historyLabel',
  'StartupDetail.locationLabel',
  'StartupDetail.officialSiteLabel',
  'StartupDetail.priorityLabel',
  'StartupDetail.sellersLabel',
  'StartupDetail.sourceLabel',
  'StartupDetail.subDomainLabel',
  'StartupDetail.teamLabel',
  'StartupDetail.teamRecLabel',
  'StartupDetail.teamTotalLabel',
  'StartupDetail.technologyLabel',
  'StartupDetail.verifiedBadge',
  'StartupDetail.viewMapLabel',
  'StartupDetail.whyRelevantLabel',
  'StartupDetail.yearLabel',
  'Status.pending',
  'Status.rejected',
  'Status.verified',
  'Theme.dark',
  'Theme.label',
  'Theme.light',
  'Theme.night',
  'Theme.system',
  'Units.backToUnits',
  'Units.count',
  'Units.focusLabel',
  'Units.navLabel',
  'Units.subtitle',
  'Units.title',
  'domainNames.agritech-foodtech',
  'domainNames.ai-computing',
  'domainNames.biotech-healthtech',
  'domainNames.cleantech',
  'domainNames.cloud-iot',
  'domainNames.cybersecurity',
  'domainNames.drones-autonomy',
  'domainNames.energy-storage',
  'domainNames.law-social-impact',
  'domainNames.manufacturing-3d',
  'domainNames.medtech',
  'domainNames.nanotech-materials',
  'domainNames.other-deep-tech',
  'domainNames.robotics',
  'domainNames.semiconductors',
  'domainNames.space-aerospace',
  'unitDescriptions.blue-bleu',
  'unitDescriptions.business-incubator',
  'unitDescriptions.cati',
  'unitDescriptions.cde',
  'unitDescriptions.mia',
  'unitDescriptions.student-services',
  'unitNames.blue-bleu',
  'unitNames.business-incubator',
  'unitNames.cati',
  'unitNames.cde',
  'unitNames.mia',
  'unitNames.student-services',
  'unitTaglines.blue-bleu',
  'unitTaglines.business-incubator',
  'unitTaglines.cati',
  'unitTaglines.cde',
  'unitTaglines.mia',
  'unitTaglines.student-services'
];

afterEach(() => cleanup());

describe('Admin console i18n', () => {
  it('renders AdminNav labels from the Admin namespace in French', () => {
    renderAdminNav('fr', fr);
    expect(screen.getByRole('link', { name: 'Tableau de bord' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Soumettre une idée' })).toBeInTheDocument();
    expect(screen.getByText('Plateforme officielle')).toBeInTheDocument();
    expect(screen.getByText('Administrateur')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Site public' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Déconnexion' })).toBeInTheDocument();
  });

  it('renders AdminNav labels from the Admin namespace in English', () => {
    renderAdminNav('en', en);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Submit an idea' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('locks trilingual parity: identical flat key sets across en/fr/ar', () => {
    const enKeys = flatten(en as unknown as Record<string, unknown>).sort();
    const frKeys = flatten(fr as unknown as Record<string, unknown>).sort();
    const arKeys = flatten(ar as unknown as Record<string, unknown>).sort();
    expect(enKeys).toEqual(frKeys);
    expect(enKeys).toEqual(arKeys);
  });

  it('keeps the pre-existing public keys unchanged and the Admin namespace complete', () => {
    const frKeys = flatten(fr as unknown as Record<string, unknown>);
    const publicKeys = frKeys.filter((key) => !key.startsWith('Admin.')).sort();
    const adminKeys = frKeys.filter((key) => key.startsWith('Admin.'));
    expect(publicKeys).toEqual(PUBLIC_KEYS);
    expect(publicKeys).toHaveLength(220);
    expect(adminKeys).toHaveLength(215);

    const enAdmin = (flatten(en as unknown as Record<string, unknown>)).filter((key) => key.startsWith('Admin.'));
    const arAdmin = (flatten(ar as unknown as Record<string, unknown>)).filter((key) => key.startsWith('Admin.'));
    expect(adminKeys.sort()).toEqual(enAdmin.sort());
    expect(adminKeys.sort()).toEqual(arAdmin.sort());
  });
});