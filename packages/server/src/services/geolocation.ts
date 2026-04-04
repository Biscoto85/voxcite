/**
 * Géolocalisation IP + vérification code postal.
 * Utilise ip-api.com (gratuit, 45 req/min).
 *
 * Stratégie anti-bot :
 * - Code postal 99999 = étranger (accepté si IP hors France)
 * - Code postal français → vérifié à ~100km près vs IP
 * - Rejet si incohérent (bot qui randomise les codes postaux)
 */

export interface GeoResult {
  country: string;
  region: string;
  lat: number;
  lon: number;
}

// ── Coordonnées approximatives par département (2 premiers chiffres du CP) ──

const DEPT_COORDS: Record<string, [number, number]> = {
  '01': [46.20, 5.23],   // Ain
  '02': [49.56, 3.62],   // Aisne
  '03': [46.34, 3.18],   // Allier
  '04': [44.09, 6.24],   // Alpes-de-Haute-Provence
  '05': [44.66, 6.26],   // Hautes-Alpes
  '06': [43.77, 7.21],   // Alpes-Maritimes
  '07': [44.74, 4.60],   // Ardèche
  '08': [49.62, 4.63],   // Ardennes
  '09': [42.93, 1.61],   // Ariège
  '10': [48.30, 4.08],   // Aube
  '11': [43.21, 2.35],   // Aude
  '12': [44.35, 2.58],   // Aveyron
  '13': [43.53, 5.08],   // Bouches-du-Rhône
  '14': [49.18, -0.37],  // Calvados
  '15': [45.03, 2.67],   // Cantal
  '16': [45.65, 0.16],   // Charente
  '17': [45.96, -0.77],  // Charente-Maritime
  '18': [47.02, 2.40],   // Cher
  '19': [45.27, 1.77],   // Corrèze
  '20': [42.15, 9.10],   // Corse (2A/2B)
  '21': [47.32, 4.80],   // Côte-d'Or
  '22': [48.44, -2.98],  // Côtes-d'Armor
  '23': [46.07, 2.07],   // Creuse
  '24': [45.18, 0.72],   // Dordogne
  '25': [47.24, 6.02],   // Doubs
  '26': [44.73, 5.17],   // Drôme
  '27': [49.09, 1.15],   // Eure
  '28': [48.32, 1.34],   // Eure-et-Loir
  '29': [48.39, -4.49],  // Finistère
  '30': [43.96, 4.08],   // Gard
  '31': [43.60, 1.44],   // Haute-Garonne
  '32': [43.65, 0.59],   // Gers
  '33': [44.84, -0.58],  // Gironde
  '34': [43.61, 3.88],   // Hérault
  '35': [48.11, -1.68],  // Ille-et-Vilaine
  '36': [46.81, 1.69],   // Indre
  '37': [47.39, 0.69],   // Indre-et-Loire
  '38': [45.19, 5.73],   // Isère
  '39': [46.67, 5.66],   // Jura
  '40': [43.89, -0.50],  // Landes
  '41': [47.59, 1.33],   // Loir-et-Cher
  '42': [45.44, 4.39],   // Loire
  '43': [45.04, 3.89],   // Haute-Loire
  '44': [47.22, -1.55],  // Loire-Atlantique
  '45': [47.90, 1.91],   // Loiret
  '46': [44.62, 1.68],   // Lot
  '47': [44.35, 0.46],   // Lot-et-Garonne
  '48': [44.52, 3.50],   // Lozère
  '49': [47.47, -0.56],  // Maine-et-Loire
  '50': [48.88, -1.35],  // Manche
  '51': [48.95, 4.36],   // Marne
  '52': [48.11, 5.14],   // Haute-Marne
  '53': [48.07, -0.77],  // Mayenne
  '54': [48.69, 6.18],   // Meurthe-et-Moselle
  '55': [49.16, 5.38],   // Meuse
  '56': [47.75, -2.76],  // Morbihan
  '57': [49.12, 6.18],   // Moselle
  '58': [47.17, 3.33],   // Nièvre
  '59': [50.30, 3.26],   // Nord
  '60': [49.42, 2.42],   // Oise
  '61': [48.57, 0.09],   // Orne
  '62': [50.49, 2.30],   // Pas-de-Calais
  '63': [45.78, 3.08],   // Puy-de-Dôme
  '64': [43.32, -0.77],  // Pyrénées-Atlantiques
  '65': [43.23, 0.15],   // Hautes-Pyrénées
  '66': [42.60, 2.54],   // Pyrénées-Orientales
  '67': [48.58, 7.75],   // Bas-Rhin
  '68': [47.75, 7.34],   // Haut-Rhin
  '69': [45.76, 4.84],   // Rhône
  '70': [47.62, 6.15],   // Haute-Saône
  '71': [46.66, 4.51],   // Saône-et-Loire
  '72': [47.99, 0.20],   // Sarthe
  '73': [45.56, 6.39],   // Savoie
  '74': [46.07, 6.41],   // Haute-Savoie
  '75': [48.86, 2.35],   // Paris
  '76': [49.44, 1.09],   // Seine-Maritime
  '77': [48.62, 2.80],   // Seine-et-Marne
  '78': [48.80, 2.00],   // Yvelines
  '79': [46.42, -0.35],  // Deux-Sèvres
  '80': [49.89, 2.30],   // Somme
  '81': [43.90, 2.15],   // Tarn
  '82': [44.01, 1.36],   // Tarn-et-Garonne
  '83': [43.47, 6.22],   // Var
  '84': [44.06, 5.05],   // Vaucluse
  '85': [46.67, -1.43],  // Vendée
  '86': [46.58, 0.34],   // Vienne
  '87': [45.85, 1.25],   // Haute-Vienne
  '88': [48.17, 6.45],   // Vosges
  '89': [47.80, 3.57],   // Yonne
  '90': [47.64, 6.86],   // Territoire de Belfort
  '91': [48.52, 2.25],   // Essonne
  '92': [48.83, 2.24],   // Hauts-de-Seine
  '93': [48.91, 2.48],   // Seine-Saint-Denis
  '94': [48.77, 2.47],   // Val-de-Marne
  '95': [49.05, 2.17],   // Val-d'Oise
  // DOM-TOM
  '97': [14.64, -61.02], // Martinique (default DOM)
};

// ── Haversine distance (km) ─────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── IP geolocation ──────────────────────────────────────────────────

const PRIVATE_IP_RE = /^(127\.|::1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

export async function geolocateIP(ip: string): Promise<GeoResult | null> {
  if (PRIVATE_IP_RE.test(ip) || ip === '::1') {
    return { country: 'FR', region: 'localhost', lat: 48.86, lon: 2.35 };
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,regionName,lat,lon`);
    const data = await res.json();
    if (data.status === 'success') {
      return {
        country: data.countryCode,
        region: data.regionName,
        lat: data.lat,
        lon: data.lon,
      };
    }
  } catch {
    // Fail silently — geolocation is best-effort
  }
  return null;
}

// ── Postal code validation ──────────────────────────────────────────

export interface PostalValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Vérifie la cohérence code postal ↔ IP.
 *
 * Règles :
 * - 99999 = étranger → accepté uniquement si IP hors France
 * - Code postal français (01xxx-97xxx) → département doit être à ≤100km de l'IP
 * - Pas de code postal → rejet
 * - Géoloc impossible → accepté (tolérance)
 */
export function validatePostalCode(
  postalCode: string | undefined,
  geo: GeoResult | null,
): PostalValidation {
  // No postal code at all → reject
  if (!postalCode || !/^\d{5}$/.test(postalCode)) {
    return { valid: false, reason: 'missing_postal' };
  }

  // 99999 = abroad
  if (postalCode === '99999') {
    if (!geo) return { valid: true }; // can't verify, accept
    if (geo.country === 'FR') {
      return { valid: false, reason: 'abroad_code_french_ip' };
    }
    return { valid: true };
  }

  // French postal code: extract département
  const dept = postalCode.startsWith('97') ? '97' : postalCode.startsWith('20') ? '20' : postalCode.slice(0, 2);
  const deptCoords = DEPT_COORDS[dept];

  if (!deptCoords) {
    return { valid: false, reason: 'invalid_department' };
  }

  // Can't geolocate IP → accept (benefit of the doubt)
  if (!geo) return { valid: true };

  // IP is abroad but using French postal code → reject
  // (except nearby countries that could be border VPNs — 200km tolerance)
  if (geo.country !== 'FR') {
    const distToDept = haversineKm(geo.lat, geo.lon, deptCoords[0], deptCoords[1]);
    if (distToDept > 200) {
      return { valid: false, reason: 'foreign_ip_french_postal' };
    }
    // Close to French border → accept
    return { valid: true };
  }

  // Both in France → check distance IP ↔ département at ~100km
  const distance = haversineKm(geo.lat, geo.lon, deptCoords[0], deptCoords[1]);

  if (distance > 150) {
    // 150km to account for IP geoloc inaccuracy + département size
    return { valid: false, reason: 'postal_ip_mismatch' };
  }

  return { valid: true };
}
