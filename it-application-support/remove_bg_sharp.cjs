const sharp = require('sharp');

async function makeTransparent(input, output) {
    const image = sharp(input);
    const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Make very light pixels transparent
        if (r > 235 && g > 235 && b > 235) {
            data[i + 3] = 0; // Set alpha to 0
        }
    }
    
    await sharp(data, {
        raw: {
            width: info.width,
            height: info.height,
            channels: 4
        }
    }).toFile(output);
}

async function run() {
    try {
        console.log("Processing GAM2...");
        await makeTransparent('./src/assets/logo GAM2.webp', './src/assets/logo_GAM2_transparent.png');
        console.log("Processing GAM3...");
        await makeTransparent('./src/assets/logo GAM3.jpg', './src/assets/logo_GAM3_transparent.png');
        console.log("Done!");
    } catch (e) {
        console.error(e);
    }
}
run();
