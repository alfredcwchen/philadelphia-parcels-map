# Local Deployment Guide

This guide explains how to deploy and run the Philadelphia Parcels Map application locally.

## Prerequisites

- Python 3.x (for simple HTTP server) or Node.js (for npx serve)
- A Mapbox access token

## Setup

### 1. Environment Configuration

Create a `.env` file in the project root:

```bash
# Copy the example and add your token
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

Get your Mapbox access token from: https://account.mapbox.com/access-tokens/

### 2. Build the Development Version

Run the build script to create `index-dev.html` with your token injected:

```bash
./dev-build.sh
```

This script will:
- Read your `MAPBOX_ACCESS_TOKEN` from the `.env` file
- Replace the placeholder in `index.html` with your actual token
- Create `index-dev.html` with the injected token

## Running Locally

### Option 1: Python HTTP Server

```bash
python -m http.server 8000
```

Then open: http://localhost:8000/index-dev.html

### Option 2: Node.js Serve

```bash
npx serve .
```

Then open the URL provided by serve (usually http://localhost:3000/index-dev.html)

### Option 3: VS Code Live Server

If you have the Live Server extension installed:
1. Right-click on `index-dev.html`
2. Select "Open with Live Server"

## Features

The application provides:
- Interactive map of Philadelphia
- Parcel data overlay (visible at zoom level 14+)
- Click parcels to view detailed property information
- Grouped property data with collapsible sections
- Multi-parcel selection when clicking overlapping parcels

## Troubleshooting

### Build Script Issues

If `./dev-build.sh` fails:

1. Make sure it's executable: `chmod +x dev-build.sh`
2. Check that `.env` file exists and contains `MAPBOX_ACCESS_TOKEN`
3. Verify your Mapbox token is valid

### Map Not Loading

If the map doesn't load:
1. Check browser console for errors
2. Verify your Mapbox token is valid and not expired
3. Ensure you're accessing via `index-dev.html` (not `index.html`)

### Parcel Data Not Showing

- Zoom in to level 14 or higher
- Parcel data is only visible at high zoom levels
- Click directly on parcel boundaries for best results