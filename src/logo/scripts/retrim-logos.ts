import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function retrimCachedLogos() {
  const storageDir = path.resolve(process.cwd(), 'storage/logos');
  console.log('\n======================================================================');
  console.log('✂️  FourX Company Logos Retrim Utility Starting...');
  console.log(`📁 Scanning directory: ${storageDir}`);
  console.log('======================================================================\n');

  if (!fs.existsSync(storageDir)) {
    console.log('Storage directory does not exist yet. Nothing to retrim.');
    return;
  }

  const files = fs.readdirSync(storageDir);
  const rasterFiles = files.filter((f) => /\.(png|jpe?g|webp)$/i.test(f));

  console.log(`Found ${rasterFiles.length} raster logo image(s) to process.\n`);
  let processed = 0;
  let trimmedCount = 0;

  for (const file of rasterFiles) {
    const fullPath = path.join(storageDir, file);
    try {
      const original = fs.readFileSync(fullPath);
      const meta = await sharp(original).metadata();

      const trimmed = await sharp(original)
        .trim() // removes surrounding solid white or transparent border
        .resize(128, 128, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      fs.writeFileSync(fullPath, trimmed);
      trimmedCount++;
      console.log(`  ✓ Retrimmed: ${file} (orig: ${meta.width}x${meta.height} -> 128x128 square)`);
    } catch (err: any) {
      console.error(`  ✗ Failed to retrim ${file}: ${err?.message}`);
    }
    processed++;
  }

  console.log('\n======================================================================');
  console.log(`✅ Retrim complete! Successfully trimmed and squared ${trimmedCount}/${processed} images.`);
  console.log('======================================================================\n');
}

retrimCachedLogos().catch((err) => {
  console.error('Retrim script failed:', err);
  process.exit(1);
});

