// Regression coverage for the shared country resolver used by the source
// pipeline, the seeder, and the DB repair scripts.
//
// The two bugs these lock down both produced silent data corruption:
//   - a loose "of <country>" tail returned the first match in COUNTRY_NAMES
//     order, so a multinational with categories for two countries (Walmart:
//     United States plus its China subsidiary) resolved to the wrong country;
//   - any category containing "israel" implied Israeli ownership, so Perrigo was
//     excluded for appearing in a Tel Aviv Stock Exchange listing category.
import { describe, expect, it } from 'vitest';
import { countryFromCategory, countryFromCategories, isTrustedCountry } from '../../scripts/lib/countries.js';

describe('countryFromCategory', () => {
  it('resolves nationality adjectives', () => {
    expect(countryFromCategory('Category:British companies')).toBe('United Kingdom');
    expect(countryFromCategory('Category:French brands')).toBe('France');
  });

  it('resolves "companies of <country>" categories', () => {
    expect(countryFromCategory('Category:Companies of China')).toBe('China');
    expect(countryFromCategory('Category:Retail companies of the United States')).toBe('United States');
    expect(countryFromCategory('Category:Manufacturers of Germany')).toBe('Germany');
    expect(countryFromCategory('Category:Brands of France')).toBe('France');
  });

  it('resolves sector chains whose article omits "companies"', () => {
    expect(countryFromCategory('Category:Pizza chains of the United States')).toBe('United States');
  });

  it('resolves headquarters-style categories', () => {
    expect(countryFromCategory('Category:Companies based in Italy')).toBe('Italy');
    expect(countryFromCategory('Category:Companies based in the United States')).toBe('United States');
  });

  it('resolves each category independently', () => {
    // Ambiguity in practice comes from a company carrying categories for several
    // countries, not from one category naming two. That case is handled by
    // countryFromCategories below.
    expect(countryFromCategory('Category:Supermarkets of China')).toBe('China');
    expect(countryFromCategory('Category:Supermarkets of the United States')).toBe('United States');
  });

  it('flags Israeli ownership signals', () => {
    expect(countryFromCategory('Category:Israeli companies')).toBe('ISRAEL_FLAG');
    expect(countryFromCategory('Category:Software companies of Israel')).toBe('ISRAEL_FLAG');
    expect(countryFromCategory('Category:Pharmaceutical companies of Israel')).toBe('ISRAEL_FLAG');
    expect(countryFromCategory('Category:Companies based in Tel Aviv')).toBe('ISRAEL_FLAG');
  });

  // A category that merely mentions Israel describes a product line or a
  // historical state, not who owns the company. Treating these as domicile
  // marked Tomcar (Turkish-American) and Goliath as Israeli, and an Israeli
  // country value causes the row to be deleted from the corpus.
  it('does not read Israeli domicile from topical Israel categories', () => {
    expect(countryFromCategory('Category:Military vehicles of Israel')).not.toBe('Israel');
    expect(countryFromCategory('Category:People from the Kingdom of Israel (united monarchy)')).not.toBe('Israel');
    expect(countryFromCategories(['Category:Military vehicles of Israel'])).not.toBe('ISRAEL_FLAG');
    expect(countryFromCategories(['Category:Military vehicles of Israel'])).not.toBe('Israel');
    expect(countryFromCategories(['Category:People from the Kingdom of Israel (united monarchy)'])).not.toBe('Israel');
  });

  it('does not flag a stock-exchange listing as Israeli ownership', () => {
    expect(countryFromCategory('Category:Companies listed on the Tel Aviv Stock Exchange')).toBeNull();
    expect(countryFromCategory('Category:Tel Aviv Stock Exchange')).toBeNull();
    expect(countryFromCategory('Category:Companies listed on the Nasdaq')).toBeNull();
    expect(countryFromCategory('Category:Companies listed on the Stock Exchange of Thailand')).toBeNull();
  });

  it('ignores subnational place names that collide with country names', () => {
    // "New Jersey" contains the Crown dependency Jersey; "Georgia (U.S. state)"
    // is a US state, not the country.
    expect(countryFromCategory('Category:Companies based in Essex County, New Jersey')).toBeNull();
    expect(countryFromCategory('Category:Privately held companies based in New Jersey')).toBeNull();
    expect(countryFromCategory('Category:Manufacturing companies based in Georgia (U.S. state)')).toBeNull();
  });
});

describe('countryFromCategories', () => {
  it('resolves to the plurality country for a multinational', () => {
    // Walmart carries one Chinese category for its local supermarket chain and
    // six US ones. Taking the last match instead returned China.
    expect(countryFromCategories([
      'Category:American companies established in 1962',
      'Category:Supermarkets of China',
      'Category:Supermarkets of the United States',
      'Category:Hypermarkets of the United States',
      'Category:Discount stores of the United States',
      'Category:Online retailers of the United States',
      'Category:Consumer electronics retailers of the United States',
    ])).toBe('United States');
  });

  it('resolves Home Depot to the United States, not Mexico or Canada', () => {
    expect(countryFromCategories([
      'Category:Hardware stores of Canada',
      'Category:Hardware stores of Mexico',
      'Category:Hardware stores of the United States',
      'Category:Home improvement retailers of the United States',
      'Category:American companies established in 1978',
    ])).toBe('United States');
  });

  it('returns null when categories tie, so no country is invented', () => {
    expect(countryFromCategories([
      'Category:Supermarkets of China',
      'Category:Supermarkets of the United States',
    ])).toBeNull();
  });

  it('returns null when no category carries country evidence', () => {
    expect(countryFromCategories([
      'Category:Artificial intelligence companies',
      'Category:Technology companies established in 2021',
    ])).toBeNull();
  });

  it('flags Israeli ownership when any category establishes it', () => {
    expect(countryFromCategories([
      'Category:Companies based in Tel Aviv',
      'Category:Technology companies of Israel',
    ])).toBe('ISRAEL_FLAG');
  });

  it('does not flag a company that merely trades in Israel', () => {
    expect(countryFromCategories([
      'Category:Companies listed on the Tel Aviv Stock Exchange',
      'Category:American pharmaceutical companies',
    ])).toBe('United States');
  });
});

describe('isTrustedCountry', () => {
  it('accepts allowlisted values and aliases', () => {
    expect(isTrustedCountry('United States')).toBe(true);
    expect(isTrustedCountry("People's Republic of China")).toBe(true);
    expect(isTrustedCountry('United Kingdom')).toBe(true);
  });

  it('rejects scraped prose, person names, and sentinels', () => {
    expect(isTrustedCountry('Unknown')).toBe(false);
    expect(isTrustedCountry('Colin Huang')).toBe(false);
    expect(isTrustedCountry('1956-2014; acquired by Actavis')).toBe(false);
    expect(isTrustedCountry('1994-2002; merged into Janssen')).toBe(false);
    expect(isTrustedCountry('FLAG')).toBe(false);
    expect(isTrustedCountry('')).toBe(false);
  });
});