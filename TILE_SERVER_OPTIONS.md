# Vector Tile Server Options for Hong Kong Parcels

## Overview
Running your own tile server allows you to serve optimized vector tiles instead of large GeoJSON files, dramatically improving performance.

## Comparison of Options

| Solution | Hosting | Cost | Complexity | Best For |
|----------|---------|------|------------|----------|
| **TileServer GL** | Self-hosted | Free + server | Medium | Full control, custom styling |
| **Martin** | Self-hosted | Free + server | Low | PostGIS integration |
| **Mapbox Studio** | Managed | $5-49/mo | Low | Quick setup, professional features |
| **Maptiler Cloud** | Managed | Free-$49/mo | Low | Alternative to Mapbox |
| **PMTiles + CDN** | Static hosting | Free | Low | Simplest, no server needed |

---

## Option 1: PMTiles + Static Hosting (RECOMMENDED - Simplest)

**Best for:** Static sites on DigitalOcean, no server management needed

### What is PMTiles?
- Single-file archive of vector tiles (like a zip file)
- Can be served from static hosting or CDN
- No tile server needed!
- Works with Mapbox GL JS v3.x+ via plugin

### Setup Steps

#### 1. Install tippecanoe (already done!)
```bash
tippecanoe --version  # Should show v2.80.0
```

#### 2. Convert GeoJSON to PMTiles
```bash
# After you export from QGIS to GeoJSON
tippecanoe -o geoJSON/hk_parcels.pmtiles \
  -Z10 -z16 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  -l hk_parcels \
  --force \
  geoJSON/hk_parcels.geojson
```

**File size comparison:**
- GeoJSON: ~50-100 MB
- PMTiles: ~10-20 MB (80% reduction!)

#### 3. Update index.html

```html
<!-- Add PMTiles plugin before your map code -->
<script src="https://unpkg.com/pmtiles@3.0.7/dist/pmtiles.js"></script>

<script>
    mapboxgl.accessToken = '{{MAPBOX_ACCESS_TOKEN}}';
    
    // Register PMTiles protocol
    let protocol = new pmtiles.Protocol();
    mapboxgl.addProtocol('pmtiles', protocol.tile);
    
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-75.163471, 39.952583],
        zoom: 12
    });
    
    map.on('load', function() {
        // Add PMTiles source
        map.addSource('hk-parcels-pmtiles', {
            type: 'vector',
            url: 'pmtiles://geoJSON/hk_parcels.pmtiles'
        });
        
        // Add fill layer
        map.addLayer({
            'id': 'hk-parcels-fill',
            'type': 'fill',
            'source': 'hk-parcels-pmtiles',
            'source-layer': 'hk_parcels',  // Must match -l parameter in tippecanoe
            'paint': {
                'fill-color': '#ff6600',
                'fill-opacity': 0.6
            },
            'layout': {
                'visibility': 'none'
            }
        });
        
        // Add outline layer
        map.addLayer({
            'id': 'hk-parcels-outline',
            'type': 'line',
            'source': 'hk-parcels-pmtiles',
            'source-layer': 'hk_parcels',
            'paint': {
                'line-color': '#ff0000',
                'line-width': 2
            },
            'layout': {
                'visibility': 'none'
            }
        });
    });
</script>
```

#### 4. Update build.sh
```bash
# Copy PMTiles file
mkdir -p dist/geoJSON
cp geoJSON/hk_parcels.pmtiles dist/geoJSON/
```

**Advantages:**
- ✅ No server needed - works on static hosting
- ✅ 80%+ smaller files
- ✅ Faster loading (only downloads visible tiles)
- ✅ Works with DigitalOcean App Platform
- ✅ Free (no additional costs)

**Limitations:**
- Requires Mapbox GL JS v3+ with plugin
- One-time setup complexity

---

## Option 2: TileServer GL on DigitalOcean (Full Control)

**Best for:** Complete control, custom styling, multiple datasets

### Architecture
```
DigitalOcean Droplet ($6/mo)
  └── TileServer GL (Docker)
      ├── Serves MBTiles vector tiles
      ├── Built-in viewer
      └── OpenMapTiles schema support
```

### Setup Steps

#### 1. Create MBTiles from GeoJSON
```bash
# Install tippecanoe (already installed)
tippecanoe -o hk_parcels.mbtiles \
  -Z10 -z16 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  -l hk_parcels \
  --force \
  geoJSON/hk_parcels.geojson
```

#### 2. Create DigitalOcean Droplet
```bash
# Create smallest droplet ($6/mo)
# Ubuntu 22.04, 1GB RAM, 25GB SSD
# Enable backups (optional, +$1.20/mo)
```

#### 3. Install TileServer GL via Docker
```bash
# SSH into droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Create directory for tiles
mkdir -p /data/tiles

# Upload your MBTiles file
scp hk_parcels.mbtiles root@your-droplet-ip:/data/tiles/

# Run TileServer GL
docker run -d \
  --name tileserver \
  -p 80:8080 \
  -v /data/tiles:/data \
  maptiler/tileserver-gl \
  --mbtiles hk_parcels.mbtiles
```

#### 4. Update your app to use tile server

```javascript
map.addSource('hk-parcels-tiles', {
    type: 'vector',
    tiles: ['http://your-droplet-ip/data/hk_parcels/{z}/{x}/{y}.pbf'],
    minzoom: 10,
    maxzoom: 16
});

map.addLayer({
    'id': 'hk-parcels-fill',
    'type': 'fill',
    'source': 'hk-parcels-tiles',
    'source-layer': 'hk_parcels',
    'paint': {
        'fill-color': '#ff6600',
        'fill-opacity': 0.6
    }
});
```

**Advantages:**
- ✅ Full control over tile generation
- ✅ Can serve multiple tilesets
- ✅ Built-in tile viewer
- ✅ Very fast tile delivery
- ✅ Can update tiles independently

**Costs:**
- 💰 $6/mo for smallest droplet
- 💰 Bandwidth costs for high traffic

---

## Option 3: Martin Tile Server (PostGIS-based)

**Best for:** Dynamic data, frequent updates, GIS database integration

### Architecture
```
DigitalOcean Droplet ($12/mo recommended)
  ├── PostgreSQL + PostGIS
  ├── Martin tile server
  └── Your shapefile data in PostGIS
```

### Setup Steps

#### 1. Create Droplet and Install PostgreSQL
```bash
# Create droplet (2GB RAM recommended, $12/mo)
ssh root@your-droplet-ip

# Install PostgreSQL and PostGIS
apt update
apt install -y postgresql postgresql-contrib postgis

# Create database
sudo -u postgres psql -c "CREATE DATABASE hk_parcels;"
sudo -u postgres psql -d hk_parcels -c "CREATE EXTENSION postgis;"
```

#### 2. Import Shapefile to PostGIS
```bash
# Install GDAL
apt install -y gdal-bin

# Import shapefile (or converted GeoJSON)
ogr2ogr -f PostgreSQL \
  PG:"dbname=hk_parcels user=postgres" \
  -nln parcels \
  -lco GEOMETRY_NAME=geom \
  -lco FID=gid \
  -t_srs EPSG:4326 \
  hk_parcels.shp
```

#### 3. Install Martin
```bash
# Download latest Martin release
wget https://github.com/maplibre/martin/releases/download/v0.11.0/martin-Linux-x86_64.tar.gz
tar -xzf martin-Linux-x86_64.tar.gz
mv martin /usr/local/bin/

# Create systemd service
cat > /etc/systemd/system/martin.service <<EOF
[Unit]
Description=Martin Tile Server
After=postgresql.service

[Service]
Type=simple
User=postgres
ExecStart=/usr/local/bin/martin postgresql://postgres@localhost/hk_parcels
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
systemctl enable martin
systemctl start martin
```

#### 4. Update your app

```javascript
map.addSource('hk-parcels-martin', {
    type: 'vector',
    tiles: ['http://your-droplet-ip:3000/parcels/{z}/{x}/{y}'],
    minzoom: 10,
    maxzoom: 16
});

map.addLayer({
    'id': 'hk-parcels-fill',
    'type': 'fill',
    'source': 'hk-parcels-martin',
    'source-layer': 'parcels',
    'paint': {
        'fill-color': '#ff6600',
        'fill-opacity': 0.6
    }
});
```

**Advantages:**
- ✅ Dynamic queries possible
- ✅ Easy data updates (just update PostGIS)
- ✅ Can filter tiles by attributes
- ✅ Integrates with existing GIS workflows

**Costs:**
- 💰 $12/mo for 2GB droplet
- 💰 More complex to maintain

---

## Option 4: Mapbox Studio (Managed Service)

**Best for:** Quick setup, professional features, don't want to manage servers

### Setup Steps

#### 1. Upload Data to Mapbox
```bash
# Install Mapbox CLI
npm install -g @mapbox/mapbox-cli

# Upload as tileset
mapbox upload username.hk_parcels geoJSON/hk_parcels.geojson
```

#### 2. Create Style in Mapbox Studio
- Go to https://studio.mapbox.com
- Create new style or add to existing
- Add your tileset as a layer
- Customize styling

#### 3. Use in your app
```javascript
map.addSource('hk-parcels-mapbox', {
    type: 'vector',
    url: 'mapbox://username.hk_parcels'
});

map.addLayer({
    'id': 'hk-parcels-fill',
    'type': 'fill',
    'source': 'hk-parcels-mapbox',
    'source-layer': 'hk_parcels',
    'paint': {
        'fill-color': '#ff6600',
        'fill-opacity': 0.6
    }
});
```

**Advantages:**
- ✅ No server management
- ✅ Global CDN
- ✅ Professional styling tools
- ✅ Automatic optimization

**Costs:**
- 💰 Free tier: 750,000 tile requests/mo
- 💰 $5/mo: 2M requests
- 💰 Pay-as-you-go beyond that

---

## Recommendation Matrix

### Your Use Case: Hong Kong Parcels Layer

| If you want... | Choose this |
|----------------|-------------|
| **Simplest setup, no extra costs** | PMTiles + Static Hosting |
| **Professional result, minimal work** | Mapbox Studio ($5/mo) |
| **Full control, technical skills** | TileServer GL ($6/mo) |
| **Dynamic updates, database integration** | Martin + PostGIS ($12/mo) |

### My Recommendation: **PMTiles + Static Hosting**

**Why:**
1. ✅ Already have tippecanoe installed
2. ✅ Works with your existing DigitalOcean setup
3. ✅ No additional monthly costs
4. ✅ 80% smaller files = faster loading
5. ✅ No server to maintain
6. ✅ Can switch to full tile server later if needed

### Quick Win Implementation

```bash
# 1. Convert to PMTiles (assuming you have hk_parcels.geojson)
tippecanoe -o geoJSON/hk_parcels.pmtiles \
  -Z10 -z16 \
  --drop-densest-as-needed \
  -l hk_parcels \
  --force \
  geoJSON/hk_parcels.geojson

# 2. Check file size
ls -lh geoJSON/hk_parcels.pmtiles

# 3. Test locally with dev-build.sh
# (Update index.html with PMTiles code first)

# 4. Deploy to DigitalOcean
# (Update build.sh to copy .pmtiles file)
```

---

## Cost Comparison (Annual)

| Solution | Annual Cost | Bandwidth | Notes |
|----------|-------------|-----------|-------|
| PMTiles + Static | $0 | Included in DO | Recommended |
| Mapbox Studio | $60-588 | CDN included | Professional |
| TileServer GL | $72 | Extra for high traffic | Full control |
| Martin + PostGIS | $144 | Extra for high traffic | Most flexible |

---

## Next Steps

1. **Choose your approach** (I recommend PMTiles)
2. **Convert your shapefile** to GeoJSON using QGIS
3. **Generate tiles** with tippecanoe
4. **Update index.html** with appropriate code
5. **Test locally**
6. **Deploy to DigitalOcean**

Let me know which option you prefer and I'll help you implement it!
