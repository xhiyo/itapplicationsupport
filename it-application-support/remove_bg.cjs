const { Jimp } = require('jimp');

async function removeWhite() {
    try {
        const image = await Jimp.read('src/assets/gramedia-g-logo.png');
        
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];
            
            if (r > 240 && g > 240 && b > 240) {
                this.bitmap.data[idx + 3] = 0; 
            }
        });

        await image.write('src/assets/gramedia-g-logo-transparent.png');
        console.log('Done!');
    } catch (e) {
        console.error(e);
    }
}

removeWhite();
