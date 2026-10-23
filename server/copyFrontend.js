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
const destAlt = path.resolve(__dirname, 'FrontEnd');

if (src) {
  try {
    fs.cpSync(src, dest, { recursive: true });
    // Also copy to server/FrontEnd in case Vercel root is server and outputDirectory is FrontEnd
    if (path.resolve(src) !== path.resolve(destAlt)) {
      fs.cpSync(src, destAlt, { recursive: true });
    }
    console.log(`✅ FrontEnd successfully copied to ${dest} and ${destAlt}`);
  } catch (err) {
    console.error('❌ Failed to copy FrontEnd assets:', err);
    process.exit(1);
  }
} else {
  console.warn('⚠️ Warning: FrontEnd source directory not found during build copy step.');
}
