const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const iconPath = path.join(process.cwd(), 'public', 'icon.svg');
  const iconBuffer = fs.readFileSync(iconPath);

  const sizes = [192, 384, 512];

  for (const size of sizes) {
    await sharp(iconBuffer)
      .resize(size, size)
      .toFile(path.join(process.cwd(), 'public', `icon-${size}.png`));
  }

  // Generate apple-touch-icon
  await sharp(iconBuffer)
    .resize(180, 180)
    .toFile(path.join(process.cwd(), 'public', 'apple-touch-icon.png'));

  // Generate favicon
  await sharp(iconBuffer)
    .resize(32, 32)
    .toFile(path.join(process.cwd(), 'public', 'favicon.ico'));
}

generateIcons().catch(console.error); 