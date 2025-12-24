/**
 * IP Geolocation Service
 * Uses ip-api.com (free tier: 45 req/min, no API key needed)
 */

export interface GeoLocation {
    country: string | null;
    city: string | null;
    region: string | null;
    countryCode: string | null;
}

// Simple in-memory cache for IP lookups (1 hour TTL)
const geoCache = new Map<string, { data: GeoLocation; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Check if an IP is private/local (skip lookup)
 */
function isPrivateIP(ip: string): boolean {
    if (!ip) return true;

    // Common private/local patterns
    const privatePatterns = [
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^::1$/,
        /^localhost$/i,
        /^fe80:/i,
        /^fc00:/i,
        /^fd00:/i,
    ];

    return privatePatterns.some(pattern => pattern.test(ip));
}

/**
 * Get geolocation data for an IP address
 */
export async function getLocationFromIP(ip: string): Promise<GeoLocation> {
    const emptyResult: GeoLocation = {
        country: null,
        city: null,
        region: null,
        countryCode: null,
    };

    // Skip private/local IPs
    if (isPrivateIP(ip)) {
        return emptyResult;
    }

    // Check cache
    const cached = geoCache.get(ip);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    try {
        // ip-api.com free tier (HTTP only for free, but fine for server-to-server)
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,regionName,countryCode`, {
            signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (!response.ok) {
            console.warn(`Geolocation lookup failed for ${ip}: HTTP ${response.status}`);
            return emptyResult;
        }

        const data = await response.json();

        if (data.status !== 'success') {
            return emptyResult;
        }

        const result: GeoLocation = {
            country: data.country || null,
            city: data.city || null,
            region: data.regionName || null,
            countryCode: data.countryCode || null,
        };

        // Cache the result
        geoCache.set(ip, {
            data: result,
            expiresAt: Date.now() + CACHE_TTL_MS,
        });

        return result;
    } catch (error) {
        // Log but don't fail - geolocation is optional
        console.warn(`Geolocation lookup failed for ${ip}:`, error);
        return emptyResult;
    }
}

/**
 * Country code to flag emoji mapping
 */
export function countryCodeToEmoji(countryCode: string | null): string {
    if (!countryCode || countryCode.length !== 2) return '🌍';

    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));

    return String.fromCodePoint(...codePoints);
}

/**
 * Parse user agent string into readable device/browser info
 */
export function parseUserAgent(userAgent: string | null): string {
    if (!userAgent) return 'Unknown Device';

    // Simple parsing - extract browser and OS
    const browsers = [
        { pattern: /Chrome\/[\d.]+/, name: 'Chrome' },
        { pattern: /Firefox\/[\d.]+/, name: 'Firefox' },
        { pattern: /Safari\/[\d.]+/, name: 'Safari' },
        { pattern: /Edge\/[\d.]+/, name: 'Edge' },
        { pattern: /MSIE [\d.]+/, name: 'Internet Explorer' },
        { pattern: /Opera\/[\d.]+/, name: 'Opera' },
    ];

    const os = [
        { pattern: /Windows NT 10/, name: 'Windows 10/11' },
        { pattern: /Windows NT 6/, name: 'Windows 7/8' },
        { pattern: /Mac OS X/, name: 'macOS' },
        { pattern: /Linux/, name: 'Linux' },
        { pattern: /Android/, name: 'Android' },
        { pattern: /iPhone|iPad/, name: 'iOS' },
    ];

    let browserName = 'Unknown Browser';
    let osName = 'Unknown OS';

    for (const browser of browsers) {
        if (browser.pattern.test(userAgent)) {
            browserName = browser.name;
            break;
        }
    }

    for (const o of os) {
        if (o.pattern.test(userAgent)) {
            osName = o.name;
            break;
        }
    }

    return `${browserName} on ${osName}`;
}
