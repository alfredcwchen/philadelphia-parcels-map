# PMTiles Tile Server for Hong Kong Data

Simple Express.js server that serves vector tiles from PMTiles files.

## Setup

```bash
cd tile-server
npm install
npm start
```

## Endpoints

- `GET /health` - Server health check
- `GET /:source/metadata.json` - Tile source metadata
- `GET /:source/:z/:x/:y.pbf` - Vector tiles in Mapbox Vector Tile format

## Sources

- `land_parcels` - Hong Kong land parcels (73 MB PMTiles)
- `buildings` - Hong Kong buildings (77 MB PMTiles)

## Testing

```bash
# Health check
curl http://localhost:3000/health

# Get metadata
curl http://localhost:3000/land_parcels/metadata.json

# Get a tile (example coordinates)
curl http://localhost:3000/land_parcels/14/13381/7143.pbf
```

## Local Development

The server runs on port 3000 by default. Update your main app to use:

```javascript
map.addSource('hk-parcels-tiles', {
    type: 'vector',
    tiles: ['http://localhost:3000/land_parcels/{z}/{x}/{y}.pbf'],
    minzoom: 10,
    maxzoom: 16
});
```

## Deployment to DigitalOcean App Platform

This can be deployed as a separate app on DigitalOcean App Platform:

1. Create new app from this `tile-server` directory
2. Set build command: `npm install`
3. Set run command: `npm start`
4. Update main app to use: `https://your-tile-server.ondigitalocean.app`
