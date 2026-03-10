// patch-memory.js
// Post-build script that runs after Webpack to remove Object.defineProperty calls from memory-manager.js
const fs = require('fs');
const path = require('path');

const bundlePath = path.resolve(__dirname, 'dist', 'memory-manager.js');
if (!fs.existsSync(bundlePath)) {
    console.error('memory-manager.js not found, run npm run build:memory first');
    process.exit(1);
}

let source = fs.readFileSync(bundlePath, 'utf8');

// Replace __esModule defineProperty (handles both `{ value: true }` and `({ value: true })`)
source = source.replace(
    /Object\.defineProperty\(exports,\s*["']__esModule["'],\s*\(?\{[\s]*value:[\s]*true[\s]*\}\)?\);/g,
    "exports['__esModule'] = true;"
);

// Remove Symbol.toStringTag defineProperty
source = source.replace(
    /Object\.defineProperty\(exports, Symbol\.toStringTag, \(?\{ value: 'Module' \}\)?\);/g,
    ''
);

// Replace defineProperty for named exports
source = source.replace(
    /Object\.defineProperty\(exports, key, \(?\{ enumerable: true, get: definition\[key\] \}\)?\);/g,
    'exports[key] = definition[key]();'
);

// Clean up empty Symbol check if statements
source = source.replace(
    /if\s*\(typeof Symbol !== 'undefined' && Symbol\.toStringTag\)\s*\{\s*\}/g,
    ''
);

// Convert harmony default export const to var to avoid temporal dead zone issues
source = source.replace(
    /\/\* harmony default export \*\/ const /g,
    '/* harmony default export */ var '
);

// Final check: warn if any defineProperty remains
const remaining = (source.match(/Object\.defineProperty/g) || []).length;
if (remaining > 0) {
    console.warn(`Warning: ${remaining} Object.defineProperty call(s) remain in memory-manager.js`);
} else {
    console.log('Success: No Object.defineProperty calls in memory-manager.js');
}

fs.writeFileSync(bundlePath, source, 'utf8');
console.log('memory-manager.js patched successfully.');
