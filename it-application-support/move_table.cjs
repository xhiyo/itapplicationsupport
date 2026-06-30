const fs = require('fs');
let content = fs.readFileSync('src/pages/dashboard.jsx', 'utf-8');

// Normalize line endings to \n
content = content.replace(/\r\n/g, '\n');

const startMarker = '                    {/* Table: Ticket Terbaru */}';
const startIndex = content.indexOf(startMarker);

// Find the Left Content closing
const leftCloseMarker = '                </div>\n\n                {/* Right Panel Sidebar */}';
let leftCloseIndex = content.indexOf(leftCloseMarker);

if (leftCloseIndex === -1) {
    // Try alternative spacing
    leftCloseIndex = content.indexOf('                </div>\n                {/* Right Panel Sidebar */}');
}
if (leftCloseIndex === -1) {
    console.log("Left close marker not found");
    process.exit(1);
}

const tableContentRaw = content.substring(startIndex, leftCloseIndex);
const tableLines = tableContentRaw.split('\n');

// The last line is the `</div>` that closes the container of Left Main Content! Wait no, leftCloseMarker is `                </div>\n\n                {/* Right Panel Sidebar */}`
// So tableLines ends right before `                </div>` of Left Main Content.
// This means the last div of Left Main Content is NOT included in tableContentRaw.
// The actual table component finishes with a `</div>` for its own container.
// Let's verify the end of tableLines.
// To be totally safe, we just extract the exact slice.

let extractedHtml = tableContentRaw.trimEnd() + '\n';

// Remove the extracted block
content = content.substring(0, startIndex) + content.substring(startIndex + extractedHtml.length);

// Now append it after the grid closing div
const gridCloseMarker = '            </div>\n        </div>\n    );\n}';
let insertIndex = content.indexOf(gridCloseMarker);

if (insertIndex === -1) {
    insertIndex = content.lastIndexOf('            </div>\n        </div>\n    );\n}');
}
if (insertIndex === -1) {
    console.log("Grid close marker not found");
    process.exit(1);
}

// Actual insertion is right after the first </div> of the gridCloseMarker
const insertPos = insertIndex + '            </div>\n'.length;

const newSection = '\n            {/* Full Width Section: Table Ticket Terbaru */}\n            <div className="mt-6 w-full">\n' + extractedHtml + '            </div>\n';

content = content.substring(0, insertPos) + newSection + content.substring(insertPos);

fs.writeFileSync('src/pages/dashboard.jsx', content);
console.log('Success');
