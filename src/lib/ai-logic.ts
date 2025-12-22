/**
 * Client-side "AI" logic for StitchCraft
 * Provides smart suggestions and anomaly detection without external APIs.
 */

// ============================================
// Measurement Anomaly Detection (Fit Guard)
// ============================================

export interface AnomalyResult {
  field: string;
  newValue: number;
  historicalAvg: number;
  deviation: number;
  severity: 'warning' | 'critical';
}

/**
 * Compares new measurements against historical data to detect potential errors.
 */
export function detectMeasurementAnomalies(
  newMeasurements: Record<string, number | string>,
  history: Array<{ values: any }>
): AnomalyResult[] {
  if (history.length === 0) return [];

  const anomalies: AnomalyResult[] = [];
  const fieldAverages: Record<string, number> = {};
  const fieldCounts: Record<string, number> = {};

  // Calculate historical averages
  for (const record of history) {
    const values = record.values as Record<string, number | string>;
    for (const [field, val] of Object.entries(values)) {
      const numVal = typeof val === 'string' ? parseFloat(val) : val;
      if (!Number.isNaN(numVal)) {
        fieldAverages[field] = (fieldAverages[field] || 0) + numVal;
        fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      }
    }
  }

  for (const field in fieldAverages) {
    fieldAverages[field] /= fieldCounts[field];
  }

  // Check for deviations
  for (const [field, val] of Object.entries(newMeasurements)) {
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    const avg = fieldAverages[field];

    if (!Number.isNaN(numVal) && avg) {
      const deviation = Math.abs((numVal - avg) / avg) * 100;

      if (deviation > 15) {
        anomalies.push({
          field,
          newValue: numVal,
          historicalAvg: avg,
          deviation,
          severity: deviation > 30 ? 'critical' : 'warning',
        });
      }
    }
  }

  return anomalies;
}

// ============================================
// Smart Price Suggestions
// ============================================

export interface PriceSuggestion {
  min: number;
  max: number;
  avg: number;
  count: number;
}

/**
 * Suggests a price range based on historical order data for a specific garment type.
 */
export function suggestPriceFromHistory(
  garmentType: string,
  orders: Array<{ garmentType: string; totalAmount: any }>
): PriceSuggestion | null {
  const matchingPrices = orders
    .filter((o) => o.garmentType === garmentType)
    .map((o) => {
      const amt = o.totalAmount;
      return typeof amt === 'string' ? parseFloat(amt) : Number(amt);
    })
    .filter((p) => !Number.isNaN(p) && p > 0)
    .sort((a, b) => a - b);

  if (matchingPrices.length === 0) return null;

  const count = matchingPrices.length;
  const avg = matchingPrices.reduce((sum, p) => sum + p, 0) / count;

  // Simple range using 25th and 75th percentiles (or min/max if too few)
  const min = matchingPrices[Math.floor(count * 0.25)];
  const max = matchingPrices[Math.floor(count * 0.75)] || matchingPrices[count - 1];

  return { min, max, avg, count };
}

// ============================================
// Portfolio & Design Suggestions
// ============================================

export const GARMENT_TAG_MAP: Record<string, string[]> = {
  KABA_AND_SLIT: ['Traditional', 'Women', 'Ghanaian', 'Formal', 'Embroidery'],
  DASHIKI: ['Traditional', 'Men', 'Casual', 'Colorful'],
  SMOCK_BATAKARI: ['Traditional', 'Northern', 'Handwoven', 'Heavy'],
  KAFTAN: ['Men', 'Formal', 'Wedding', 'Embroidery'],
  AGBADA: ['Ceremonial', 'Men', 'Elite', 'Three-piece'],
  COMPLET: ['Women', 'Matched', 'Traditional'],
  KENTE_CLOTH: ['Prestige', 'Handwoven', 'Ceremonial', 'Gold'],
  BOUBOU: ['Women', 'Flowing', 'Comfortable'],
  SUIT: ['Modern', 'Corporate', 'Formal', 'Wedding'],
  DRESS: ['Modern', 'Casual', 'Party', 'A-line'],
  SHIRT: ['Bespoke', 'Casual', 'Office'],
  TROUSERS: ['Tailored', 'Formal', 'Casual'],
};

/**
 * Suggests tags based on the selected garment type.
 */
export function suggestTagsForGarment(garmentType: string): string[] {
  return GARMENT_TAG_MAP[garmentType] || ['Bespoke', 'Custom-made'];
}

// ============================================
// Measurement Range Hints
// ============================================

// Typical ranges in inches for adult measurements
export const TYPICAL_MEASUREMENT_RANGES: Record<string, [number, number]> = {
  chest: [30, 60],
  waist: [24, 54],
  hips: [32, 64],
  shoulder: [14, 22],
  sleeve: [20, 30],
  neck: [12, 20],
  length: [20, 65],
  bust: [30, 58],
  under_bust: [26, 50],
  thigh: [18, 32],
  ankle: [8, 14],
};

/**
 * Provides a hint if a measurement is outside typical human ranges.
 */
export function getMeasurementHint(field: string, value: number): string | null {
  const range = TYPICAL_MEASUREMENT_RANGES[field.toLowerCase()];
  if (!range) return null;

  const [min, max] = range;
  if (value < min) return `Unusually small for ${field.replace(/_/g, ' ')}`;
  if (value > max) return `Unusually large for ${field.replace(/_/g, ' ')}`;

  return null;
}

