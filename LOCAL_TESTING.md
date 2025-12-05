# Local Testing Guide

This guide explains how to run and test the Philadelphia Parcels Map locally before deploying to DigitalOcean.

## Quick Start

```bash
# 1. Start the tile server (Terminal 1)
cd /workspaces/localretool/tile-server
node server.js

# 2. Start the web server (Terminal 2)
cd /workspaces/localretool
python3 -m http.server 8080

# 3. Open in your browser
# http://localhost:8080/index-local.html
```

## Detailed Setup

### Prerequisites

- Node.js installed
- Python 3 installed
- Mapbox access token in `.env` file

### Step 1: Configure Environment

Make sure your `.env` file exists with your Mapbox token:

```bash
# Check if .env exists
cat .env

# Should contain:
# MAPBOX_ACCESS_TOKEN=pk.eyJ1...
```

The `index-local.html` file should have the token already replaced. If not, manually edit line 478.

### Step 2: Start the Tile Server

The tile server serves vector tiles from PMTiles files.

```bash
cd /workspaces/localretool/tile-server
node server.js
```

**Expected output:**
```
✓ Loaded land_parcels: /workspaces/localretool/tile-server/pmtiles/LandParcel_Lot_HK.pmtiles
✓ Loaded buildings: /workspaces/localretool/tile-server/pmtiles/Building_HK.pmtiles

🚀 PMTiles Tile Server running at http://localhost:3000

Available sources:
  - land_parcels: http://localhost:3000/land_parcels/{z}/{x}/{y}.pbf
  - buildings: http://localhost:3000/buildings/{z}/{x}/{y}.pbf

Test with: curl http://localhost:3000/health
```

**Test it:**
```bash
# Health check
curl http://localhost:3000/health
# Expected: {"status":"ok","sources":["land_parcels","buildings"],"port":3000}

# Metadata
curl http://localhost:3000/land_parcels/metadata.json | jq

# Test a tile
curl -I http://localhost:3000/land_parcels/14/13388/7150.pbf
# Expected: HTTP/1.1 200 OK
```

### Step 3: Start the Web Server

The web server serves the HTML/JS files.

```bash
cd /workspaces/localretool
python3 -m http.server 8080
```

**Expected output:**
```
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...
```

### Step 4: Open in Browser

**Option A: Using VS Code Port Forwarding (Recommended)**

1. Open VS Code **PORTS** tab (bottom panel, next to Terminal)
2. You should see ports **3000** and **8080** auto-forwarded
3. Right-click on port **8080** → **Open in Browser**
4. Add `/index-local.html` to the URL

**Option B: Direct Access**

Open in your browser:
```
http://localhost:8080/index-local.html
```

**Note:** The VS Code Simple Browser doesn't support WebGL, so you must use your host browser (Chrome, Firefox, Safari, Edge).

## File Differences

### Local vs Production

- **index-local.html**: Points to `http://localhost:3000` (tile server)
- **index.html**: Points to `https://terratone-tiles-mfayf.ondigitalocean.app` (production)

**index-local.html configuration:**
```javascript
// Hong Kong Land Parcels
map.addSource('hk-parcels-geojson', {
    type: 'vector',
    tiles: ['http://localhost:3000/land_parcels/{z}/{x}/{y}.pbf'],
    minzoom: 10,
    maxzoom: 16
});

// Hong Kong Buildings
map.addSource('hk-buildings-geojson', {
    type: 'vector',
    tiles: ['http://localhost:3000/buildings/{z}/{x}/{y}.pbf'],
    minzoom: 10,
    maxzoom: 16
});
```

## Testing Checklist

- [ ] Tile server starts without errors
- [ ] Health endpoint returns valid JSON
- [ ] Web server serves index-local.html
- [ ] Map loads in browser (should see Philadelphia base map)
- [ ] Toggle "HK Land Parcels" layer - orange polygons appear over Hong Kong
- [ ] Toggle "HK Buildings" layer - blue polygons appear over Hong Kong
- [ ] No CORS errors in browser console
- [ ] No "Failed to fetch" errors
- [ ] Tiles load when zooming in/out over Hong Kong

## Troubleshooting

### Blank Screen

**Issue:** Browser shows blank white screen

**Solution:** 
- Check browser console for errors (F12)
- Verify Mapbox token is set (not `{{MAPBOX_ACCESS_TOKEN}}`)
- Make sure you're using your host browser, not VS Code Simple Browser

### CORS Errors

**Issue:** `Access-Control-Allow-Origin` errors

**Solution:**
- Make sure tile server is running on port 3000
- Check that `index-local.html` points to `http://localhost:3000`
- Verify CORS is enabled in `tile-server/server.js`

### Failed to Fetch Tiles

**Issue:** Browser console shows `Error: Failed to fetch`

**Solution:**
```bash
# Test if tile server is responding
curl http://localhost:3000/health

# Test a specific tile
curl -I http://localhost:3000/land_parcels/14/13388/7150.pbf

# If no response, restart tile server
cd /workspaces/localretool/tile-server
pkill -f "node server"
node server.js
```

### Port Already in Use

**Issue:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Kill existing process
pkill -f "node server"

# Or kill specific port
lsof -ti:3000 | xargs kill -9

# Restart
node server.js
```

### Mapbox Token Error

**Issue:** `401 Unauthorized` errors from api.mapbox.com

**Solution:**
- Check if `.env` file exists and has valid token
- Edit `index-local.html` line 478 to replace `{{MAPBOX_ACCESS_TOKEN}}` with your actual token
- Get a new token at: https://account.mapbox.com/access-tokens/

## Stopping Servers

When done testing:

```bash
# Stop tile server
pkill -f "node server"

# Stop web server
pkill -f "python3 -m http.server"

# Or press Ctrl+C in each terminal
```

## Performance Testing

Test tile loading performance:

```bash
# Time a tile request
time curl -s http://localhost:3000/land_parcels/14/13388/7150.pbf -o /dev/null

# Check tile size
curl -s http://localhost:3000/land_parcels/14/13388/7150.pbf | wc -c
```

## Background Mode

To run servers in background:

```bash
# Start tile server in background
cd /workspaces/localretool/tile-server
node server.js &

# Start web server in background
cd /workspaces/localretool
python3 -m http.server 8080 &

# Check running processes
ps aux | grep -E "node server|http.server"

# Stop all background servers
pkill -f "node server"
pkill -f "python3 -m http.server"
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser (http://localhost:8080/index-local.html)   │
└────────────┬───────────────────────────┬────────────┘
             │                           │
             │ HTML/JS/CSS               │ Tile Requests
             │                           │ /land_parcels/{z}/{x}/{y}.pbf
             ▼                           ▼
┌─────────────────────────┐  ┌──────────────────────────┐
│   Web Server            │  │   Tile Server            │
│   Python HTTP           │  │   Node.js Express        │
│   Port 8080             │  │   Port 3000              │
│                         │  │                          │
│   Serves:               │  │   Serves:                │
│   - index-local.html    │  │   - Vector tiles (.pbf)  │
│   - CSS, JS             │  │   - Metadata JSON        │
└─────────────────────────┘  └───────────┬──────────────┘
                                         │
                                         │ Reads PMTiles
                                         ▼
                             ┌───────────────────────────┐
                             │  PMTiles Files (150 MB)   │
                             │  - LandParcel_Lot_HK      │
                             │  - Building_HK            │
                             └───────────────────────────┘
```

## Next Steps

After local testing confirms everything works:

1. Commit changes to git
2. Push to GitHub
3. DigitalOcean automatically deploys both apps
4. Test production URLs:
   - Main app: https://philly-map-3xgv2.ondigitalocean.app/
   - Tile server: https://terratone-tiles-mfayf.ondigitalocean.app/health
