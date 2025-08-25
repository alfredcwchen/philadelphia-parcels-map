// Load environment variables for local development
// This script reads the .env file and replaces the token placeholder in index.html

const fs = require('fs');
const path = require('path');

// Read .env file if it exists
const envPath = path.join(__dirname, '.env');
const htmlPath = path.join(__dirname, 'index.html');

if (!fs.existsSync(envPath)) {
    console.log('No .env file found. Please create one from .env.example');
    console.log('cp .env.example .env');
    process.exit(1);
}

// Parse .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
            envVars[key.trim()] = valueParts.join('=').trim();
        }
    }
});

if (!envVars.MAPBOX_ACCESS_TOKEN) {
    console.log('MAPBOX_ACCESS_TOKEN not found in .env file');
    process.exit(1);
}

// Read index.html and replace placeholder
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const updatedContent = htmlContent.replace('{{MAPBOX_ACCESS_TOKEN}}', envVars.MAPBOX_ACCESS_TOKEN);

// Write to temp file for local development
const tempHtmlPath = path.join(__dirname, 'index-dev.html');
fs.writeFileSync(tempHtmlPath, updatedContent);

console.log('Created index-dev.html with your Mapbox token for local development');
console.log('Open index-dev.html with Live Server instead of index.html');