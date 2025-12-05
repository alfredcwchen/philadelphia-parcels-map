#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const { PMTiles } = require('pmtiles');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Enhanced CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Range'],
    exposedHeaders: ['Content-Length', 'Content-Type', 'Content-Encoding'],
    credentials: false,
    maxAge: 86400
}));

// Handle OPTIONS requests explicitly
app.options('*', cors());

const TILES_DIR = path.join(__dirname, 'pmtiles');
const sources = {};

// FileSystemSource that works with Node.js
class FileSystemSource {
    constructor(filepath) {
        this.filepath = filepath;
        this.stat = fs.statSync(filepath);
    }

    getKey() {
        return this.filepath;
    }

    async getBytes(offset, length) {
        return new Promise((resolve, reject) => {
            const fd = fs.openSync(this.filepath, 'r');
            try {
                const buffer = Buffer.alloc(length);
                const bytesRead = fs.readSync(fd, buffer, 0, length, offset);
                fs.closeSync(fd);
                
                // Create a true ArrayBuffer and copy data into it
                const arrayBuffer = new ArrayBuffer(bytesRead);
                const uint8Array = new Uint8Array(arrayBuffer);
                for (let i = 0; i < bytesRead; i++) {
                    uint8Array[i] = buffer[i];
                }
                
                // Return RangeResponse object with data as ArrayBuffer
                resolve({ data: arrayBuffer });
            } catch (error) {
                fs.closeSync(fd);
                reject(error);
            }
        });
    }
}

async function initPMTiles() {
    // Auto-discover all .pmtiles files in current directory and pmtiles subdirectory
    const directories = [__dirname, path.join(__dirname, 'pmtiles')];
    
    for (const dir of directories) {
        if (!fs.existsSync(dir)) continue;
        
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.pmtiles'));
        
        for (const filename of files) {
            const filepath = path.join(dir, filename);
            const name = filename.replace('.pmtiles', '');
            
            try {
                const source = new FileSystemSource(filepath);
                const pmtiles = new PMTiles(source);
                // Test that it can read the header
                await pmtiles.getHeader();
                sources[name] = pmtiles;
                console.log(`✓ Loaded ${name}: ${filepath}`);
            } catch (error) {
                console.error(`✗ Failed to load ${name}:`, error.message);
            }
        }
    }
}

// Metadata endpoint
app.get('/:source/metadata.json', async (req, res) => {
    const { source } = req.params;
    const pmtiles = sources[source];
    
    if (!pmtiles) {
        return res.status(404).json({ error: 'Source not found' });
    }

    try {
        const header = await pmtiles.getHeader();
        const metadata = await pmtiles.getMetadata();
        
        res.json({
            name: source,
            format: 'pbf',
            minzoom: header.minZoom,
            maxzoom: header.maxZoom,
            bounds: [header.minLon, header.minLat, header.maxLon, header.maxLat],
            center: [
                (header.minLon + header.maxLon) / 2,
                (header.minLat + header.maxLat) / 2,
                Math.floor((header.minZoom + header.maxZoom) / 2)
            ],
            vector_layers: metadata?.vector_layers || []
        });
    } catch (error) {
        console.error('Metadata error:', error);
        res.status(500).json({ error: 'Failed to get metadata', details: error.message });
    }
});

// Tiles endpoint
app.get('/:source/:z/:x/:y.pbf', async (req, res) => {
    const { source, z, x, y } = req.params;
    const pmtiles = sources[source];
    
    if (!pmtiles) {
        return res.status(404).send('Source not found');
    }

    try {
        const zNum = parseInt(z);
        const xNum = parseInt(x);
        const yNum = parseInt(y);

        const tile = await pmtiles.getZxy(zNum, xNum, yNum);
        
        if (!tile || !tile.data) {
            return res.status(204).send();
        }

        res.setHeader('Content-Type', 'application/x-protobuf');
        // Don't set Content-Encoding - Mapbox GL JS will handle gzip decompression
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(Buffer.from(tile.data));
    } catch (error) {
        console.error(`Tile error ${source}/${z}/${x}/${y}:`, error.message);
        res.status(500).send('Error serving tile');
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        sources: Object.keys(sources),
        port: PORT
    });
});

// Root
app.get('/', (req, res) => {
    res.json({
        message: 'PMTiles Tile Server',
        sources: Object.keys(sources),
        endpoints: {
            metadata: '/:source/metadata.json',
            tiles: '/:source/{z}/{x}/{y}.pbf',
            health: '/health'
        }
    });
});

// Start
initPMTiles().then(() => {
    app.listen(PORT, () => {
        console.log(`\n🚀 PMTiles Tile Server running at http://localhost:${PORT}`);
        console.log(`\nAvailable sources:`);
        Object.keys(sources).forEach(source => {
            console.log(`  - ${source}: http://localhost:${PORT}/${source}/{z}/{x}/{y}.pbf`);
        });
        console.log(`\nTest with: curl http://localhost:${PORT}/health\n`);
    });
});
