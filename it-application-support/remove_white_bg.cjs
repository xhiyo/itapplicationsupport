const sharp = require('sharp');
const Jimp = require('jimp');

async function processImages() {
    try {
        console.log("Converting WebP to PNG...");
        await sharp('./src/assets/logo GAM2.webp').toFile('./src/assets/logo_GAM2_temp.png');
        
        console.log("Removing white background from GAM2...");
        const img2 = await Jimp.read('./src/assets/logo_GAM2_temp.png');
        img2.scan(0, 0, img2.bitmap.width, img2.bitmap.height, function(x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];
            // If pixel is close to white, make it transparent
            if (r > 235 && g > 235 && b > 235) {
                this.bitmap.data[idx + 3] = 0; // Alpha channel
            }
        });
        await img2.writeAsync('./src/assets/logo_GAM2_transparent.png');

        console.log("Removing white background from GAM3...");
        const img3 = await Jimp.read('./src/assets/logo GAM3.jpg');
        img3.scan(0, 0, img3.bitmap.width, img3.bitmap.height, function(x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];
            if (r > 235 && g > 235 && b > 235) {
                this.bitmap.data[idx + 3] = 0; // Alpha channel
            }
        });
        await img3.writeAsync('./src/assets/logo_GAM3_transparent.png');
        
        console.log("Successfully created transparent logos!");
    } catch (err) {
        console.error("Error processing images:", err);
    }
}
processImages();
