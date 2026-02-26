/**
 * Environment Variables Validation
 * Ensures all required env vars are present before app starts
 */

// Required environment variables for production
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET_NAME',
  'NEXT_PUBLIC_CDN_URL',
] as const;

// Optional but recommended
const recommendedEnvVars = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
] as const;

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validate all required environment variables
 */
export function validateEnv(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  // Check recommended vars
  recommendedEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Throw error if env validation fails
 * Call this in server-side code only
 */
export function requireEnv(): void {
  const result = validateEnv();

  if (!result.valid) {
    const errorMessage = `
╔════════════════════════════════════════════════════════════╗
║  ❌ Missing Required Environment Variables                ║
╚════════════════════════════════════════════════════════════╝

Missing variables:
${result.missing.map(v => `  • ${v}`).join('\n')}

${result.warnings.length > 0 ? `
⚠️  Missing recommended variables (non-critical):
${result.warnings.map(v => `  • ${v}`).join('\n')}
` : ''}

Please add these to your .env.local file.
See .env.example for reference.
    `.trim();

    throw new Error(errorMessage);
  }

  // Log warnings if any
  if (result.warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('\n⚠️  Missing recommended environment variables:');
    result.warnings.forEach(v => console.warn(`  • ${v}`));
    console.warn('');
  }
}

/**
 * Get environment info for debugging
 */
export function getEnvInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    supabaseConfigured: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    awsConfigured: !!(
      process.env.AWS_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
    ),
    razorpayConfigured: !!(
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET
    ),
  };
}

/**
 * Type-safe environment variables access
 */
export const env = {
  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },

  // AWS
  aws: {
    region: process.env.AWS_REGION!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    s3BucketName: process.env.AWS_S3_BUCKET_NAME!,
    cdnUrl: process.env.NEXT_PUBLIC_CDN_URL!,
  },

  // Razorpay
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },

  // App
  app: {
    nodeEnv: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    vercelEnv: process.env.VERCEL_ENV,
  },
} as const;
