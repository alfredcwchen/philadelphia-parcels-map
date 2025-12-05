# Philadelphia Parcels Map

Interactive Mapbox map displaying Philadelphia parcel data with professional popup tables.

## Features
- Click on parcels to view detailed property information
- Collapsible grouped property sections
- Horizontal scrolling for long data
- Tooltips for truncated content
- Professional table styling
- Address search with Mapbox Geocoder + Google Geocoding API
- Multiple city layers: Philadelphia, Hong Kong, Seattle, BC Canada

## Setup

### Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your API keys:
```bash
# Required: Mapbox access token
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsInR5cCI6IkpXVCJ9...

# Optional: Google Maps API key for better Hong Kong geocoding
GOOGLE_MAPS_API_KEY=AIzaSyD...
```

3. Generate the development HTML:
```bash
node load-env.cjs
```

4. Open `index-dev.html` with Live Server

### API Keys

**Mapbox Token** (Required):
- Get at: https://account.mapbox.com/access-tokens/
- Used for map rendering and base geocoding

**Google Maps API Key** (Optional):
- Get at: https://console.cloud.google.com/google/maps-apis/credentials
- Enable the **Geocoding API** for your project
- Provides better Hong Kong address search
- Falls back to Mapbox if not configured

## Deployment
Deployed on DigitalOcean App Platform

## Usage
Simply open the map and zoom to level 14+ to see parcel boundaries. Click on any parcel to view its details.