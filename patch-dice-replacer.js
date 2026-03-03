const fs = require('fs');
const path = require('path');

const bundlePath = process.argv[2] ? path.resolve(__dirname, process.argv[2]) : path.resolve(__dirname, 'dist', 'dice-replacer.js');
if (!fs.existsSync(bundlePath)) {
    console.error(`${path.basename(bundlePath)} not found, run webpack first`);
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
    console.warn(`Warning: ${remaining} Object.defineProperty call(s) remain in ${path.basename(bundlePath)}`);
} else {
    console.log(`Success: No Object.defineProperty calls in ${path.basename(bundlePath)}`);
}

// Create both versions
const sourceTrue = source.replace(/const bot_define_rules = (true|false);/g, 'const bot_define_rules = true;');
const sourceFalse = source.replace(/const bot_define_rules = (true|false);/g, 'const bot_define_rules = false;');

// Write dice-replacer.js (bot_define_rules = true)
fs.writeFileSync(path.resolve(__dirname, 'dist', 'dice-replacer.js'), sourceTrue, 'utf8');
console.log(`dice-replacer.js (bot_define_rules: true) created successfully.`);

// Write dice-replacer-strict.js (bot_define_rules = false)
fs.writeFileSync(path.resolve(__dirname, 'dist', 'dice-replacer-strict.js'), sourceFalse, 'utf8');
console.log(`dice-replacer-strict.js (bot_define_rules: false) created successfully.`);
