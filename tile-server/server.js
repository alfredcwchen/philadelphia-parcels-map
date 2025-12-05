#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const { PMTiles } = require('pmtiles');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Serve PMTiles
const TILES_DIR = path.join(__dirname, 'pmtiles');

// Initialize PMTiles sources
const sources = {};

// Custom file source adapter for Node.js
class NodeFileSource {
    constructor(filepath) {
        this.filepath = filepath;
        this.fd = null;
    }

    async getBytes(offset, length) {
        try {
            if (!this.fd) {
                this.fd = await fs.open(this.filepath, 'r');
            }
            const buffer = Buffer.alloc(length);
            const { bytesRead } = await this.fd.read(buffer, 0, length, offset);
            return buffer.slice(0, bytesRead);
        } catch (error) {
            console.error('Error reading bytes:', error);
            throw error;
        }
    }

    async getKey() {
        return this.filepath;
    }
}

async function initPMTiles() {
    const files = {
        'land_parcels': 'LandParcel_Lot_HK.pmtiles',
        'buildings': 'Building_HK.pmtiles'
    };

    for (const [name, filename] of Object.entries(files)) {
        const filepath = path.join(TILES_DIR, filename);
        if (fsSync.existsSync(filepath)) {
            const source = new NodeFileSource(filepath);
            const pmtiles = new PMTiles(source);
            sources[name] = pmtiles;
            console.log(`✓ Loaded ${name}: ${filepath}`);
        } else {
            console.error(`✗ File not found: ${filepath}`);
        }
    }
}

// Serve tile metadata
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
        console.error('Error getting metadata:', error);
        res.status(500).json({ error: 'Failed to get metadata' });
    }
});

// Serve tiles
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
            return res.status(204).send(); // No content
        }

        res.setHeader('Content-Type', 'application/x-protobuf');
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
        res.send(Buffer.from(tile.data));
    } catch (error) {
        console.error('Error serving tile:', error);
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

// Debug endpoint
app.get('/debug/:source', async (req, res) => {
    const { source } = req.params;
    const pmtiles = sources[source];
    
    if (!pmtiles) {
        return res.status(404).json({ error: 'Source not found', available: Object.keys(sources) });
    }

    try {
        const header = await pmtiles.getHeader();
        res.json({ 
            success: true,
            header: {
                minZoom: header.minZoom,
                maxZoom: header.maxZoom,
                bounds: [header.minLon, header.minLat, header.maxLon, header.maxLat]
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: error.stack 
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'PMTiles Tile Server',
        sources: Object.keys(sources),
        endpoints: {
            metadata: '/:source/metadata.json',
            tiles: '/:source/{z}/{x}/{y}.pbf',
            health: '/health'
        },
        examples: {
            land_parcels: `/land_parcels/14/13381/7143.pbf`,
            buildings: `/buildings/14/13381/7143.pbf`
        }
    });
});

// Start server
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
