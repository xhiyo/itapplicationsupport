const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function replaceStyles(filePath) {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Change 'bg-white border' to 'bg-transparent border' in classNames related to inputs.
        // We target typical input class patterns.
        const inputPatterns = [
            /className="w-full px-4 py-2.5 text-sm font-medium border/g,
            /className="w-full pl-4 pr-10 py-2.5 text-sm font-medium bg-white border/g,
            /className="w-full px-4 py-3 text-sm border/g,
            /className="w-full px-3 py-2 text-sm border/g,
            /className="flex-1 px-4 py-2 text-sm border/g,
        ];

        for (const pattern of inputPatterns) {
            if (content.match(pattern)) {
                content = content.replace(pattern, (match) => {
                    return match.replace('bg-white ', 'bg-transparent ').replace('px-4 py-2.5', 'px-3 py-2.5').replace('px-4 py-3', 'px-3 py-2.5').replace('text-sm', 'text-[13px] bg-transparent');
                });
                modified = true;
            }
        }

        // Fix double bg-transparent
        if (content.includes('bg-transparent bg-transparent')) {
            content = content.replace(/bg-transparent bg-transparent/g, 'bg-transparent');
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${filePath}`);
        }
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else {
            replaceStyles(fullPath);
        }
    }
}

walkDir(directoryPath);
console.log('Restyling pass 3 completed.');
