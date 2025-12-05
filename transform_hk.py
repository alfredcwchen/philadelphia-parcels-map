import json
import math

def epsg2326_to_wgs84(easting, northing):
    """
    Convert EPSG:2326 (Hong Kong 1980 Grid) to WGS84
    Based on proper Transverse Mercator inverse projection
    Reference: https://epsg.io/2326
    """
    # EPSG:2326 uses International 1924 ellipsoid
    a = 6378388.0  # semi-major axis
    f = 1.0 / 297.0  # flattening
    
    # Hong Kong 1980 Grid projection parameters
    lat_origin = 22.312133333333  # degrees
    lon_origin = 114.178555555556  # degrees (central meridian)
    false_easting = 836694.05
    false_northing = 819069.8
    scale_factor = 1.0
    
    # Convert to radians
    lat0 = math.radians(lat_origin)
    lon0 = math.radians(lon_origin)
    k0 = scale_factor
    
    # Calculate ellipsoid parameters
    b = a * (1 - f)
    e_sq = 1 - (b * b) / (a * a)
    e = math.sqrt(e_sq)
    
    # Remove false easting/northing
    x = easting - false_easting
    y = northing - false_northing
    
    # Calculate meridional arc
    M = y / k0
    
    # Calculate footpoint latitude
    mu = M / (a * (1 - e_sq/4 - 3*e_sq*e_sq/64 - 5*e_sq*e_sq*e_sq/256))
    
    e1 = (1 - math.sqrt(1 - e_sq)) / (1 + math.sqrt(1 - e_sq))
    
    J1 = (3 * e1 / 2 - 27 * e1**3 / 32)
    J2 = (21 * e1**2 / 16 - 55 * e1**4 / 32)
    J3 = (151 * e1**3 / 96)
    
    fp = mu + J1 * math.sin(2 * mu) + J2 * math.sin(4 * mu) + J3 * math.sin(6 * mu)
    
    # Calculate latitude and longitude
    C1 = e_sq * (math.cos(fp))**2 / (1 - e_sq)
    T1 = (math.tan(fp))**2
    R1 = a * (1 - e_sq) / ((1 - e_sq * (math.sin(fp))**2)**1.5)
    N1 = a / math.sqrt(1 - e_sq * (math.sin(fp))**2)
    D = x / (N1 * k0)
    
    # Latitude
    Q1 = N1 * math.tan(fp) / R1
    Q2 = D**2 / 2
    Q3 = (5 + 3 * T1 + 10 * C1 - 4 * C1**2 - 9 * e_sq) * D**4 / 24
    Q4 = (61 + 90 * T1 + 298 * C1 + 45 * T1**2 - 252 * e_sq - 3 * C1**2) * D**6 / 720
    
    lat_rad = fp - Q1 * (Q2 - Q3 + Q4)
    
    # Longitude  
    Q5 = D
    Q6 = (1 + 2 * T1 + C1) * D**3 / 6
    Q7 = (5 - 2 * C1 + 28 * T1 - 3 * C1**2 + 8 * e_sq + 24 * T1**2) * D**5 / 120
    
    lon_rad = lon0 + (Q5 - Q6 + Q7) / math.cos(fp)
    
    # Convert to degrees
    lat = math.degrees(lat_rad)
    lon = math.degrees(lon_rad)
    
    return [lon, lat]

print("Loading data...")
with open('geoJSON/Lot_GEOJSON/LandParcel_Lot_PUBLIC_20251014.gdb_LOT_converted.json', 'r') as f:
    data = json.load(f)

# Test with first feature
test_coord = data['features'][0]['geometry']['coordinates'][0][0]
test_result = epsg2326_to_wgs84(test_coord[0], test_coord[1])
print(f"\nTest conversion:")
print(f"Original (EPSG:2326): E={test_coord[0]:.2f}, N={test_coord[1]:.2f}")
print(f"Converted (WGS84): Lon={test_result[0]:.6f}, Lat={test_result[1]:.6f}")
print(f"(Should be around Lon=114.0-114.5, Lat=22.2-22.5 for Hong Kong)")

# Convert sample
print(f"\nConverting 10,000 distributed features...")
sample_features = data['features'][::38][:10000]

for i, feature in enumerate(sample_features):
    if i % 2000 == 0:
        print(f"  Progress: {i}/{len(sample_features)}")
    
    if feature['geometry']['type'] == 'Polygon':
        new_coords = []
        for ring in feature['geometry']['coordinates']:
            new_ring = [epsg2326_to_wgs84(c[0], c[1]) for c in ring]
            new_coords.append(new_ring)
        feature['geometry']['coordinates'] = new_coords

output = {
    "type": "FeatureCollection",
    "name": "LOT",
    "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
    "features": sample_features
}

with open('geoJSON/hk_parcels_correct.geojson', 'w') as f:
    json.dump(output, f)

print(f"\n✓ Created: geoJSON/hk_parcels_correct.geojson")
print(f"✓ Features: {len(sample_features)}")

# Show bounds
lons = [output['features'][0]['geometry']['coordinates'][0][0][0]]
lats = [output['features'][0]['geometry']['coordinates'][0][0][1]]
print(f"\nSample coordinate: Lon={lons[0]:.6f}, Lat={lats[0]:.6f}")
