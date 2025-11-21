const fs = require('fs');
const path = require('path');

// Load .env only if it exists (for local development)
// In production (Netlify), environment variables come from platform
try {
    require('dotenv').config();
} catch (e) {
    // dotenv not needed in production
}

// Determine build mode
const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');
const targetFile = isProd
    ? path.join(__dirname, 'src', 'environments', 'environment.ts')
    : path.join(__dirname, 'src', 'environments', 'environment.development.ts');

// Read values from process.env (works both locally and in Netlify)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

console.log('[set-env] Environment check:');
console.log('[set-env] SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('[set-env] SUPABASE_KEY:', supabaseKey ? '✓ Set' : '✗ Missing');

console.log('[set-env] Environment check:');
console.log('[set-env] SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('[set-env] SUPABASE_KEY:', supabaseKey ? '✓ Set' : '✗ Missing');

// Exit with error if missing in production
if (isProd && (!supabaseUrl || !supabaseKey)) {
    console.error('[set-env] ERROR: Missing required environment variables!');
    console.error('[set-env] Please set SUPABASE_URL and SUPABASE_KEY in Netlify dashboard');
    process.exit(1);
}

// Warn if missing in development
if (!isProd && (!supabaseUrl || !supabaseKey)) {
    console.warn('[set-env] WARNING: Missing SUPABASE_URL or SUPABASE_KEY in .env');
}

const fileContent = `export const environment = {
	production: ${isProd},
	supabaseUrl: '${supabaseUrl}',
	supabaseKey: '${supabaseKey}'
};\n`;

fs.writeFileSync(targetFile, fileContent, 'utf-8');
console.log(`[set-env] Wrote ${isProd ? 'production' : 'development'} environment to ${targetFile}`);
