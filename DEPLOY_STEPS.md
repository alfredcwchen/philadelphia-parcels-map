# DigitalOcean Tile Server Deployment Steps

## ✅ Preparation Complete
- ✅ Tile server code committed and pushed to GitHub
- ✅ PMTiles files ready (150 MB total)
- ✅ Local testing successful

## 📋 Deployment Checklist

### Step 1: Create New App on DigitalOcean

1. **Go to DigitalOcean Dashboard**
   - Navigate to: https://cloud.digitalocean.com/apps
   - Click **"Create App"**

2. **Connect GitHub Repository**
   - Select **"GitHub"** as source
   - Authorize DigitalOcean to access your GitHub account
   - Choose repository: `alfredcwchen/philadelphia-parcels-map`
   - Select branch: `main`
   - Click **"Next"**

### Step 2: Configure App Settings

1. **Source Directory**
   - Set source directory to: `/tile-server`
   - This ensures DigitalOcean only builds the tile server

2. **Build Settings**
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
   - Auto-deploy: Enable (recommended)

3. **Environment**
   - **HTTP Port**: `3000`
   - Leave other settings as default

### Step 3: Choose Instance Size

**Recommended Options:**

**Option A: Basic Plan ($5/month)**
- CPU: 512 MB RAM, 1 vCPU
- Good for: Light to moderate traffic
- Bandwidth: 100 GB/month
- Suitable for testing and small deployments

**Option B: Professional-XS ($12/month)**
- CPU: 1 GB RAM, 1 vCPU
- Good for: Production use with moderate traffic
- Bandwidth: 250 GB/month
- Better performance under load

**Recommendation**: Start with Basic ($5/month), upgrade if needed

### Step 4: Name Your App

- **Suggested Name**: `hk-tiles` or `philadelphia-hk-tiles`
- This will create URL: `https://hk-tiles-xxxxx.ondigitalocean.app`
- Click **"Next"**

### Step 5: Review and Deploy

1. Review all settings
2. Click **"Create Resources"**
3. Wait 3-5 minutes for deployment
4. **Important**: Copy your app URL (e.g., `https://hk-tiles-abc123.ondigitalocean.app`)

### Step 6: Verify Deployment

Test the health endpoint:
```bash
curl https://YOUR-APP-URL.ondigitalocean.app/health
```

Expected response:
```json
{"status":"ok","sources":["land_parcels","buildings"],"port":3000}
```

Test a tile endpoint:
```bash
curl -I https://YOUR-APP-URL.ondigitalocean.app/land_parcels/12/3245/1635.pbf
```

Expected: HTTP 200 with `Content-Type: application/x-protobuf`

---

## 🔄 Next Steps: Update Main App

After tile server is deployed successfully:

### 1. Update index.html to Use Tile Server

Replace the GeoJSON sources with vector tile sources:

```javascript
// Replace this:
map.addSource('hk-parcels', {
    type: 'geojson',
    data: 'geoJSON/HKGIS/LandParcel_Lot_HK_wgs84.geojson'
});

// With this:
map.addSource('hk-parcels', {
    type: 'vector',
    tiles: ['https://YOUR-APP-URL.ondigitalocean.app/land_parcels/{z}/{x}/{y}.pbf'],
    minzoom: 10,
    maxzoom: 16
});
```

Update layer definitions to include `source-layer`:

```javascript
map.addLayer({
    id: 'hk-parcels-layer',
    type: 'fill',
    source: 'hk-parcels',
    'source-layer': 'land_parcels',  // Add this
    paint: {
        'fill-color': '#088',
        'fill-opacity': 0.3
    }
});
```

### 2. Remove Large GeoJSON Files

After confirming the tile server works:

```bash
# Remove large GeoJSON files
git rm geoJSON/HKGIS/Building_HK_wgs84.geojson
git rm geoJSON/HKGIS/LandParcel_Lot_HK_wgs84.geojson

# Remove from Git LFS
git lfs untrack 'geoJSON/HKGIS/*.geojson'

# Update .gitattributes and commit
git add .gitattributes
git commit -m "Remove large GeoJSON files, now using tile server"
git push
```

### 3. Update build.sh

Remove the Git LFS pull logic since we no longer need the large files:

```bash
# Remove or comment out:
# git lfs pull
# cp -v ../geoJSON/HKGIS/*_wgs84.geojson dist/geoJSON/HKGIS/
```

---

## 📊 Performance Comparison

| Metric | Before (GeoJSON) | After (Tile Server) |
|--------|------------------|---------------------|
| Main App Size | 471 MB | ~100 KB |
| User Download | 471 MB (full data) | ~5-10 MB (visible tiles) |
| Load Time | 30-60 seconds | 2-3 seconds |
| Monthly Cost | $0 (static) | $5 (Basic) or $12 (Pro-XS) |
| Total Cost | $0/month | $5-12/month |

---

## 🐛 Troubleshooting

### Issue: Tile server won't start
- **Check**: Build logs in DigitalOcean dashboard
- **Solution**: Ensure `npm install` completed successfully
- **Verify**: PMTiles files are in correct location

### Issue: 404 on tile requests
- **Check**: Health endpoint responds correctly
- **Solution**: Verify URL pattern matches: `/{source}/{z}/{x}/{y}.pbf`
- **Verify**: Source names are `land_parcels` or `buildings`

### Issue: CORS errors
- **Check**: Tile server includes CORS headers
- **Solution**: Already configured in `server.js`
- **Verify**: Response includes `Access-Control-Allow-Origin: *`

### Issue: Tiles load slowly
- **Solution 1**: Upgrade to Professional-XS plan ($12/month)
- **Solution 2**: Add CDN in DigitalOcean app settings
- **Check**: Bandwidth usage in app metrics

---

## 💰 Cost Breakdown

### Current Setup (GeoJSON)
- Main App: $0/month (Static Sites free tier)
- **Total: $0/month**

### New Setup (Tile Server)
- Main App: $0/month (Static Sites free tier)
- Tile Server: $5/month (Basic) or $12/month (Professional-XS)
- **Total: $5-12/month**

### Cost Justification
- 94% smaller user downloads (471 MB → ~5-10 MB)
- 90% faster load times (30-60s → 2-3s)
- Better user experience on mobile devices
- Scalable for future growth

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Health endpoint returns `{"status":"ok",...}`
2. ✅ Tile requests return HTTP 200 with Protobuf content
3. ✅ Main app loads Hong Kong layers from tile server
4. ✅ Map interactions (pan, zoom, click) work correctly
5. ✅ Layer toggles function properly
6. ✅ Mobile view is responsive

---

## 📝 Notes

- **Auto-deployment**: Enabled by default - any push to main branch will redeploy
- **Monitoring**: Check DigitalOcean dashboard for metrics and logs
- **Scaling**: Can upgrade instance size anytime without downtime
- **Rollback**: Can revert to previous deployment in DigitalOcean dashboard

---

## 🚀 Ready to Deploy?

**Current Status**: All code committed and pushed to GitHub

**Your next action**: 
1. Open https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Follow Steps 1-6 above

**Estimated Time**: 10 minutes setup + 5 minutes deployment

Good luck! 🎉
