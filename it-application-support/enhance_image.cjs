const sharp = require('sharp');
const fs = require('fs');

async function enhanceImage() {
    try {
        const input = './src/assets/Kantor Gramedia.jpeg';
        const output = './src/assets/enhanced_Kantor_Gramedia.webp'; // Switch to WebP
        
        const metadata = await sharp(input).metadata();
        console.log(`Original size: ${metadata.width}x${metadata.height}`);
        
        const scaleFactor = 3; // Upscale to 4K (2880x3840)
        
        await sharp(input)
            .resize({
                width: Math.round(metadata.width * scaleFactor),
                height: Math.round(metadata.height * scaleFactor),
                kernel: sharp.kernel.lanczos3
            })
            .modulate({
                brightness: 1.25,
                saturation: 1.20
            })
            .sharpen({
                sigma: 1.8,
                m1: 1.5,
                m2: 0.8
            })
            .webp({ quality: 80 }) // 80% quality WebP compression
            .toFile(output);
            
        // Delete the old 17MB PNG
        if (fs.existsSync('./src/assets/enhanced_Kantor_Gramedia.png')) {
            fs.unlinkSync('./src/assets/enhanced_Kantor_Gramedia.png');
        }
            
        console.log(`Successfully upscaled to 4K (${Math.round(metadata.width * scaleFactor)}x${Math.round(metadata.height * scaleFactor)}) as a compressed WebP!`);
    } catch (e) {
        console.error("Error enhancing image:", e);
    }
}

enhanceImage();
