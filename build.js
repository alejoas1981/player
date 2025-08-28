const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Order of files, same as in HTML <script>
const files = [
    './src/core/EventManager.js',
    './src/media/VideoSource.js',
    './src/media/AudioSource.js',
    './src/media/DASHSource.js',
    './src/libs/hls.js',
    './src/media/HLSSource.js',
    './src/media/Mp4Source.js',
    './src/core/MediaFactory.js',
    './src/UI/UIManager.js',
    './src/core/ConfigManager.js',
    './src/core/AnalyticsManager.js',
    './src/core/AdManager.js',
    './src/player.js'
];

const distDir = path.resolve(__dirname, 'dist');
const outputFile = path.join(distDir, 'UniversalPlayer.js');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

// Merge all files into one
let bundle = '';
for (const file of files) {
    bundle += fs.readFileSync(path.resolve(__dirname, file), 'utf-8') + '\n';
}

// Write merged content to UniversalPlayer.js
fs.writeFileSync(outputFile, bundle, 'utf-8');
console.log('✅ Files merged into UniversalPlayer.js');

// Minify using terser (make sure terser is installed)
try {
    execSync(`npx terser ${outputFile} -o ${outputFile} --compress --mangle`, { stdio: 'inherit' });
    console.log('✅ UniversalPlayer.js minified');
} catch (err) {
    console.error('❌ Error during minification', err);
}
