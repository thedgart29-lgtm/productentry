const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

const ROOT_DIR = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'out');
const STANDALONE_DIR = path.join(ROOT_DIR, '.next', 'standalone');

async function build() {
  console.log('Building Next.js application...');
  try {
    execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
  } catch (err) {
    console.error('Next.js build failed.');
    process.exit(1);
  }

  console.log('Preparing output directory...');
  await fs.remove(OUT_DIR);
  await fs.ensureDir(OUT_DIR);

  console.log('Copying standalone build...');
  await fs.copy(STANDALONE_DIR, OUT_DIR);

  console.log('Copying static assets...');
  // The standalone build needs the .next/static folder inside .next directory
  await fs.copy(
    path.join(ROOT_DIR, '.next', 'static'),
    path.join(OUT_DIR, '.next', 'static')
  );

  console.log('Copying public folder...');
  await fs.copy(
    path.join(ROOT_DIR, 'public'),
    path.join(OUT_DIR, 'public')
  );

  console.log('Electron build preparation complete.');
}

build().catch(console.error);
