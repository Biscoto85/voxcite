/**
 * Géolocalisation IP pour vérification du code postal.
 * Utilise ip-api.com (gratuit, 45 req/min).
 */

interface GeoResult {
  country: string;
  region: string;
  lat: number;
  lon: number;
}

export async function geolocateIP(ip: string): Promise<GeoResult | null> {
  // Skip localhost / private IPs
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: 'FR', region: 'localhost', lat: 48.86, lon: 2.35 };
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,lat,lon`);
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

/**
 * Vérifie la cohérence entre un code postal français et la géolocalisation IP.
 * Retourne true si cohérent (ou si vérification impossible).
 * Tolérant : accepte si même pays, ou si IP non géolocalisable.
 */
export function isPostalCodePlausible(
  postalCode: string,
  geo: GeoResult | null,
): boolean {
  // 00000 = étranger, always OK
  if (postalCode === '00000') return true;

  // Can't verify? Accept it.
  if (!geo) return true;

  // If IP is in France, accept any French postal code
  if (geo.country === 'FR') return true;

  // If IP is foreign but postal code is French, flag as suspicious
  // but still accept (VPN users, travellers)
  return true; // v1: accept everything, just log the geo data
}
