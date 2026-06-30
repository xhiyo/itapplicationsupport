const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function replaceStyles(filePath) {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Replace focus:ring-2 focus:ring-blue-100 with nothing
        if (content.includes('focus:ring-2 focus:ring-blue-100')) {
            content = content.replace(/focus:ring-2 focus:ring-blue-100/g, '');
            modified = true;
        }

        if (content.includes('focus:ring-4 focus:ring-blue-500/10')) {
            content = content.replace(/focus:ring-4 focus:ring-blue-500\/10/g, '');
            modified = true;
        }

        if (content.includes('focus:ring-2 focus:ring-blue-500')) {
            content = content.replace(/focus:ring-2 focus:ring-blue-500/g, '');
            modified = true;
        }

        // Change border-slate-200 to border-slate-200/80
        if (content.match(/border border-slate-200 /)) {
            content = content.replace(/border border-slate-200 /g, 'border border-slate-200/80 ');
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
console.log('Restyling pass 2 completed.');
