import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const svgBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'icon.svg'));

  // Generate PNG icons
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'icon.png'));

  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'apple-icon.png'));

  // Generate favicon.ico (16x16 and 32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .toFormat('png')
    .toBuffer()
    .then(async (data) => {
      await sharp(svgBuffer)
        .resize(16, 16)
        .toFormat('png')
        .toBuffer()
        .then((smallerData) => {
          // Combine both sizes into an ICO file
          const ico = Buffer.concat([
            // ICO header
            Buffer.from([0, 0, 1, 0, 2, 0]),
            // 16x16 entry
            Buffer.from([16, 16, 0, 0, 1, 0, 32, 0]),
            Buffer.from(new Uint32Array([smallerData.length + 40]).buffer),
            Buffer.from(new Uint32Array([22]).buffer),
            // 32x32 entry
            Buffer.from([32, 32, 0, 0, 1, 0, 32, 0]),
            Buffer.from(new Uint32Array([data.length + 40]).buffer),
            Buffer.from(new Uint32Array([22 + smallerData.length + 40]).buffer),
            // 16x16 bitmap header
            Buffer.from([40, 0, 0, 0, 16, 0, 0, 0, 32, 0, 0, 0, 1, 0, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            // 16x16 data
            smallerData,
            // 32x32 bitmap header
            Buffer.from([40, 0, 0, 0, 32, 0, 0, 0, 64, 0, 0, 0, 1, 0, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            // 32x32 data
            data
          ]);

          fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.ico'), ico);
        });
    });

  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error); 