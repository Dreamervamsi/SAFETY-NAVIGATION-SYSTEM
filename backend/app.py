from fastapi import FastAPI, HTTPException
import httpx

app = FastAPI()

OSRM_URL = "https://router.project-osrm.org/route/v1/driving/"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

async def get_safety_data(lat, lon):

    query = f"""
    [out:json][timeout:10];
    (
      node["amenity"~"police|hospital|pharmacy"](around:50,{lat},{lon});
      node["highway"="street_lamp"](around:50,{lat},{lon});
      way["lit"="yes"](around:50,{lat},{lon});
    );
    out tags;
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(OVERPASS_URL, params={'data': query})
            data = response.json()
            return data.get('elements', [])
        except:
            return []

@app.get("/score-route")
async def score_route(start_coords: str, end_coords: str):
    async with httpx.AsyncClient() as client:
        osrm_resp = await client.get(f"{OSRM_URL}{start_coords};{end_coords}?overview=full&geometries=geojson")
        if osrm_resp.status_code != 200:
            raise HTTPException(status_code=500, detail="Routing engine error")
        
        route_data = osrm_resp.json()['routes'][0]

        coordinates = route_data['geometry']['coordinates']
        sample_points = [coordinates[0], coordinates[len(coordinates)//2], coordinates[-1]]

  
    total_score = 40  # base score
    found_features = []

    for lon, lat in sample_points:
        features = await get_safety_data(lat, lon)
        if features:
            total_score += 20
            found_features.append(features[0].get('tags', {}))

    final_score = min(total_score, 100)

    # 3. Determine Color
    if final_score > 75:
        color = "#4CAF50" 
        label = "Safe"
    elif final_score > 50:
        color = "#FFC107" 
        label = "Caution"
    else:
        color = "#F44336"
        label = "Avoid"

    return {
        "score": final_score,
        "color": color,
        "status": label,
        "geometry": route_data['geometry'],
        "distance_meters": route_data['distance']
    }