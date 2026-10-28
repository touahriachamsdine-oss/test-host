/**
 * Backfill map coordinates for imported/legacy rows that have a country but no pin.
 * Country-level coordinates (capital city) are used where no city is known.
 *
 * Rollback: UPDATE startups SET latitude = NULL, longitude = NULL WHERE source_note LIKE '%country-level pin%';
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const COORDS = {
  'United States': [38.9072, -77.0369],
  China: [39.9042, 116.4074],
  Germany: [52.52, 13.405],
  'United Kingdom': [51.5074, -0.1278],
  Canada: [45.4215, -75.6972],
  India: [28.6139, 77.209],
  Algeria: [36.7538, 3.0588],
  Japan: [35.6762, 139.6503],
  France: [48.8566, 2.3522],
  Australia: [-35.2809, 149.13],
  Italy: [41.9028, 12.4964],
  'South Korea': [37.5665, 126.978],
  Netherlands: [52.3676, 4.9041],
  Spain: [40.4168, -3.7038],
  Russia: [55.7558, 37.6173],
  Sweden: [59.3293, 18.0686],
  Turkey: [39.9334, 32.8597],
  Norway: [59.9139, 10.7522],
  Switzerland: [46.948, 7.4474],
  Brazil: [-15.7939, -47.8828],
  Belgium: [50.8503, 4.3517],
  Mexico: [19.4326, -99.1332],
  Egypt: [30.0444, 31.2357],
  Singapore: [1.3521, 103.8198],
  Denmark: [55.6761, 12.5683],
  'New Zealand': [-41.2865, 174.7762],
  Taiwan: [25.033, 121.5654],
  Morocco: [34.0209, -6.8416],
  Ireland: [53.3498, -6.2603],
  Finland: [60.1699, 24.9384],
  Greece: [37.9838, 23.7275],
  Indonesia: [-6.2088, 106.8456],
  Poland: [52.2297, 21.0122],
  Thailand: [13.7563, 100.5018],
  Israel: [31.7683, 35.2137],
  Kenya: [-1.2921, 36.8219],
  Argentina: [-34.6037, -58.3816],
  Portugal: [38.7223, -9.1393],
  Pakistan: [33.6844, 73.0479],
  'United Arab Emirates': [24.4539, 54.3773],
  Vietnam: [21.0278, 105.8342],
  Malaysia: [3.139, 101.6869],
  Austria: [48.2082, 16.3738],
  Nigeria: [9.0765, 7.3986],
  'South Africa': [-25.7479, 28.2293],
  Bangladesh: [23.8103, 90.4125],
  Philippines: [14.5995, 120.9842],
  Chile: [-33.4489, -70.6693],
  'Saudi Arabia': [24.7136, 46.6753],
  Iran: [35.6892, 51.389],
  Croatia: [45.815, 15.9819],
  Romania: [44.4268, 26.1025],
  Tunisia: [36.8065, 10.1815],
  'Hong Kong': [22.3193, 114.1694],
  Ukraine: [50.4501, 30.5234],
  Palestine: [31.9522, 35.2332],
  Estonia: [59.437, 24.7536],
  Jordan: [31.9454, 35.9284],
  Bulgaria: [42.6977, 23.3219],
  Colombia: [4.711, -74.0721],
  Peru: [-12.0464, -77.0428],
  Hungary: [47.4979, 19.0402],
  'Czech Republic': [50.0755, 14.4378],
  Czechia: [50.0755, 14.4378],
  Serbia: [44.7866, 20.4489],
  Ghana: [5.6037, -0.187],
  Luxembourg: [49.6116, 6.1319],
  'Sri Lanka': [6.9271, 79.8612],
  Azerbaijan: [40.4093, 49.8671],
  Latvia: [56.9496, 24.1052],
  Belarus: [53.9006, 27.559],
  Slovenia: [46.0569, 14.5058],
  Moldova: [47.0105, 28.8638],
  Armenia: [40.1792, 44.5152],
  Namibia: [-22.5609, 17.0658],
  Myanmar: [16.8409, 96.1735],
  Lithuania: [54.6872, 25.2797],
  Slovakia: [48.1486, 17.1077],
  Venezuela: [10.4806, -66.9036],
  Ethiopia: [9.032, 38.7469],
  Nepal: [27.7172, 85.324],
  Botswana: [-24.6282, 25.9231],
  Ecuador: [-0.1807, -78.4678],
  Georgia: [41.7151, 44.8271],
  Zimbabwe: [-17.8252, 31.0335],
  Uganda: [0.3476, 32.5825],
  'Faroe Islands': [62.0079, -6.79],
  Uzbekistan: [41.2995, 69.2401],
  Malta: [35.8989, 14.5146],
  Iceland: [64.1466, -21.9426],
  Kuwait: [29.3759, 47.9774],
  'Bosnia and Herzegovina': [43.8563, 18.4131],
  Rwanda: [-1.9441, 30.0619],
  Qatar: [25.2854, 51.531],
  Angola: [-8.839, 13.2894],
  Uruguay: [-34.9011, -56.1645],
  Oman: [23.588, 58.3829],
  Bermuda: [32.2949, -64.7825],
  Kazakhstan: [51.1694, 71.4491],
  Tanzania: [-6.7924, 39.2083],
  Bolivia: [-16.4897, -68.1193],
  Seychelles: [-4.6191, 55.4513],
  'Costa Rica': [9.9281, -84.0907],
  Panama: [8.9824, -79.5199],
  Iraq: [33.3152, 44.3661],
  Malawi: [-13.9626, 33.7741],
  Turkmenistan: [37.9601, 58.3261],
  Congo: [-4.2634, 15.2429],
  Sudan: [15.5007, 32.5599],
  Benin: [6.4969, 2.6289],
  'Sierra Leone': [8.4657, -13.2317],
  Zambia: [-15.3875, 28.3228],
  Senegal: [14.7167, -17.4677],
  'Cayman Islands': [19.3133, -81.2546],
  Cameroon: [3.848, 11.5021],
  'Papua New Guinea': [-9.4438, 147.1803],
  Cambodia: [11.5564, 104.9282],
  Lebanon: [33.8938, 35.5018],
  'Côte d’Ivoire': [6.8276, -5.2893],
  "Côte d'Ivoire": [6.8276, -5.2893],
  Scotland: [55.9533, -3.1883]
};

const ALIASES = {
  GR: 'Greece',
  UA: 'Ukraine',
  MD: 'Moldova',
  BG: 'Bulgaria',
  SK: 'Slovakia',
  GE: 'Georgia',
  HK: 'Hong Kong',
  JO: 'Jordan',
  LT: 'Lithuania',
  LV: 'Latvia',
  SU: 'Russia'
};

const W = "status = 'verified' AND is_duplicate_2025 = FALSE";

function readDatabaseUrl() {
  const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  return env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '');
}

(async () => {
  const client = new Client({ connectionString: readDatabaseUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();

  let aliased = 0;
  for (const [code, name] of Object.entries(ALIASES)) {
    const res = await client.query(`UPDATE startups SET country = $1 WHERE country = $2 AND ${W}`, [name, code]);
    aliased += res.rowCount;
  }
  console.log('country codes normalised:', aliased);

  let updated = 0;
  let skipped = 0;
  for (const [country, [lat, lng]] of Object.entries(COORDS)) {
    const res = await client.query(
      `UPDATE startups
          SET latitude = $1,
              longitude = $2,
              source_note = CASE WHEN source_note IS NULL OR source_note = ''
                                 THEN 'Country-level pin (capital coordinates).'
                                 ELSE source_note || ' | Country-level pin (capital coordinates).' END
        WHERE country = $3 AND ${W} AND (latitude IS NULL OR longitude IS NULL)`,
      [lat, lng, country]
    );
    if (res.rowCount) console.log(String(country).padEnd(24), res.rowCount);
    updated += res.rowCount;
  }

  const left = await client.query(
    `SELECT country, COUNT(*)::int n FROM startups WHERE ${W} AND (latitude IS NULL OR longitude IS NULL)
     GROUP BY country ORDER BY n DESC`
  );
  for (const row of left.rows) console.log('still missing:', row.country, row.n);
  skipped = left.rows.reduce((sum, r) => sum + r.n, 0);
  console.log('updated:', updated, '| still missing:', skipped);
  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
