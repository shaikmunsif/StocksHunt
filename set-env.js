const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Determine build mode
const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');
const targetFile = isProd
    ? path.join(__dirname, 'src', 'environments', 'environment.ts')
    : path.join(__dirname, 'src', 'environments', 'environment.development.ts');

// Read values
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

// Warn if missing
if (!supabaseUrl || !supabaseKey) {
    console.warn('[set-env] Missing SUPABASE_URL or SUPABASE_KEY in .env');
}

const fileContent = `export const environment = {
	production: ${isProd},
	supabaseUrl: '${supabaseUrl}',
	supabaseKey: '${supabaseKey}'
};\n`;

fs.writeFileSync(targetFile, fileContent, 'utf-8');
console.log(`[set-env] Wrote ${isProd ? 'production' : 'development'} environment to ${targetFile}`);
