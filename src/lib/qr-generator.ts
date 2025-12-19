import QRCode from 'qrcode';

// ============================================
// QR Code Generator
// For client tracking portal access
// ============================================

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

const DEFAULT_OPTIONS: QRCodeOptions = {
  width: 256,
  margin: 2,
  color: {
    dark: '#006B3F', // Ghana green
    light: '#FFFFFF',
  },
};

// ============================================
// Generate QR Code as Data URL
// ============================================

export async function generateQRDataURL(data: string, options?: QRCodeOptions): Promise<string> {
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    color: {
      ...DEFAULT_OPTIONS.color,
      ...options?.color,
    },
  };

  return QRCode.toDataURL(data, {
    width: mergedOptions.width,
    margin: mergedOptions.margin,
    color: mergedOptions.color,
  });
}

// ============================================
// Generate QR Code as SVG String
// ============================================

export async function generateQRSVG(data: string, options?: QRCodeOptions): Promise<string> {
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    color: {
      ...DEFAULT_OPTIONS.color,
      ...options?.color,
    },
  };

  return QRCode.toString(data, {
    type: 'svg',
    width: mergedOptions.width,
    margin: mergedOptions.margin,
    color: mergedOptions.color,
  });
}

// ============================================
// Generate QR Code as Buffer (for file saving)
// ============================================

export async function generateQRBuffer(data: string, options?: QRCodeOptions): Promise<Buffer> {
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    color: {
      ...DEFAULT_OPTIONS.color,
      ...options?.color,
    },
  };

  return QRCode.toBuffer(data, {
    width: mergedOptions.width,
    margin: mergedOptions.margin,
    color: mergedOptions.color,
  });
}

// ============================================
// Generate Client Tracking QR Code
// ============================================

export async function generateTrackingQR(
  trackingUrl: string,
  options?: QRCodeOptions
): Promise<{
  dataUrl: string;
  svg: string;
}> {
  const [dataUrl, svg] = await Promise.all([
    generateQRDataURL(trackingUrl, options),
    generateQRSVG(trackingUrl, options),
  ]);

  return { dataUrl, svg };
}

// ============================================
// Generate QR with Ghana Theme
// ============================================

export async function generateGhanaThemedQR(data: string): Promise<string> {
  return generateQRDataURL(data, {
    width: 300,
    margin: 3,
    color: {
      dark: '#006B3F', // Ghana green
      light: '#FDF5E6', // Cream background
    },
  });
}

// ============================================
// Generate QR with Gold Accent
// ============================================

export async function generateGoldAccentQR(data: string): Promise<string> {
  return generateQRDataURL(data, {
    width: 300,
    margin: 3,
    color: {
      dark: '#4A2C2A', // Dark brown
      light: '#FCD116', // Ghana gold
    },
  });
}
