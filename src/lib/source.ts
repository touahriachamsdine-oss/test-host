export type SourceKind = 'curated' | 'patent' | 'openHardware' | 'enterpriseFile';

const PREFIX_KIND: Array<[string, SourceKind]> = [
  ['pt-', 'patent'],
  ['oh-', 'openHardware'],
  ['ae-', 'enterpriseFile']
];

export function sourceKindOf(id: string): SourceKind {
  for (const [prefix, kind] of PREFIX_KIND) {
    if (id.startsWith(prefix)) return kind;
  }
  return 'curated';
}

export function sourceLabelKey(kind: SourceKind): string {
  return kind;
}
