const fs = require('fs');
const path = require('path');

// Candidate source directories for FrontEnd
const sourceCandidates = [
  path.resolve(__dirname, '../FrontEnd'),
  path.resolve(process.cwd(), '../FrontEnd'),
  path.resolve(process.cwd(), 'FrontEnd'),
];

const src = sourceCandidates.find((p) => fs.existsSync(p));
const dest = path.resolve(__dirname, 'dist/FrontEnd');

if (src) {
  try {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`✅ FrontEnd successfully copied from ${src} to ${dest}`);
  } catch (err) {
    console.error('❌ Failed to copy FrontEnd assets to dist:', err);
    process.exit(1);
  }
} else {
  console.warn('⚠️ Warning: FrontEnd source directory not found during build copy step.');
}
