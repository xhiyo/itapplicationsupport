const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function replaceStyles(filePath) {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove aggressive rounded corners
        content = content.replace(/rounded-3xl/g, 'rounded-md');
        content = content.replace(/rounded-2xl/g, 'rounded-md');
        content = content.replace(/rounded-xl/g, 'rounded-[4px]');
        content = content.replace(/rounded-lg/g, 'rounded-[4px]');

        // Update inputs & selects to match the new style
        // Usually they have `bg-slate-50`, `border-transparent`, `focus:ring`
        content = content.replace(/bg-slate-50 dark:bg-slate-800\/50 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500\/10/g, 'bg-transparent border-slate-200/80 dark:border-slate-800 focus:border-blue-500 focus:outline-none focus:ring-0');
        
        // Update generic inputs
        content = content.replace(/className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3/g, 'className="w-full bg-transparent border border-slate-200/80 dark:border-slate-800 rounded-[4px] px-3 py-2.5');

        fs.writeFileSync(filePath, content, 'utf8');
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
console.log('Restyling completed.');
