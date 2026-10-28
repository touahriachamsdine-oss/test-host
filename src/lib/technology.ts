const IPC_CLASS = /^[A-H]\d{2}[A-Z]/;

const IPC_SECTION = /\b([A-H])\d{2}[A-Z]\b/g;

/**
 * Patent rows store raw IPC classification codes in `technology`
 * (e.g. "C02F1/5236;;C01D7/18"). Those are accurate but unreadable, so the UI
 * renders the section names instead.
 */
export function isIpcClassification(value: string): boolean {
  const parts = value
    .split(/[;,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return false;
  const matches = parts.filter((part) => IPC_CLASS.test(part)).length;
  return matches > 0 && matches / parts.length >= 0.5;
}

export function ipcSections(value: string): string[] {
  const sections = new Set<string>();
  for (const match of value.matchAll(IPC_SECTION)) sections.add(match[1]);
  return [...sections].sort();
}

export function ipcClasses(value: string, limit = 3): string[] {
  const classes = new Set<string>();
  for (const part of value.split(/[;,\s]+/)) {
    const code = part.trim().slice(0, 4);
    if (/^[A-H]\d{2}[A-Z]$/.test(code)) classes.add(code);
  }
  return [...classes].slice(0, limit);
}
