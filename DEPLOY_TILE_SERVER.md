# Deploying Tile Server to DigitalOcean App Platform

## Steps to Deploy

### 1. Prepare the Repository

The tile server is ready in the `tile-server/` directory with:
- ✅ `server.js` - Express server
- ✅ `package.json` - Dependencies
- ✅ `README.md` - Documentation

### 2. Create New App on DigitalOcean

1. Go to https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Choose **GitHub** as source
4. Select repository: `alfredcwchen/philadelphia-parcels-map`
5. Click **"Next"**

### 3. Configure the App

**Source Directory:**
- Set source directory to: `/tile-server`
- This tells DO to only deploy the tile-server folder

**Build Settings:**
- Build Command: `npm install`
- Run Command: `npm start`
- Port: `3000`

**Environment:**
- Type: **Web Service**
- Instance Size: **Basic** ($5/month - 512MB RAM, 1 vCPU)
- Or **Professional-XS** ($12/month - 1GB RAM) for better performance

**Name:** 
- App name: `hk-tiles` (or your preference)

### 4. Deploy

Click **"Create Resources"** and wait 3-5 minutes for deployment.

You'll get a URL like: `https://hk-tiles-xxxxx.ondigitalocean.app`

### 5. Update Your Main App

After tile server is deployed, update `index.html` in your main app:

```javascript
// Change from localhost to your tile server URL
const TILE_SERVER = 'https://hk-tiles-xxxxx.ondigitalocean.app';

map.addSource('hk-parcels-tiles', {
    type: 'vector',
    tiles: [`${TILE_SERVER}/land_parcels/{z}/{x}/{y}.pbf`],
    minzoom: 10,
    maxzoom: 16
});
```

### 6. Remove Large GeoJSON Files

Once tile server is working, remove the 471 MB GeoJSON files from main app:

```bash
git rm geoJSON/HKGIS/Building_HK_wgs84.geojson
git rm geoJSON/HKGIS/LandParcel_Lot_HK_wgs84.geojson
```

## Cost Summary

| Service | Cost | Purpose |
|---------|------|---------|
| Main App (Static) | $0/month | HTML/JS only |
| Tile Server (Basic) | $5/month | Serves PMTiles |
| **Total** | **$5/month** | Complete solution |

## Benefits

- ✅ Main app: ~100 KB (vs 471 MB)
- ✅ Users download: ~5-10 MB (only visible tiles)
- ✅ Faster initial load
- ✅ Scalable architecture
- ✅ Easy to update data independently

## Ready to Deploy?

Once you're ready, I'll:
1. Add tile-server files to git
2. Push to GitHub
3. Guide you through DigitalOcean setup
