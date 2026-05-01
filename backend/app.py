import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
import httpx
from groq import Groq
import tempfile


load_dotenv()

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OSRM_URL = "https://router.project-osrm.org/route/v1/driving/"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client_groq = Groq(api_key=GROQ_API_KEY)

async def get_safety_data(lat, lon):

    query = f"""
    [out:json][timeout:10];
    (
      node["amenity"~"police|hospital|pharmacy"](around:300,{lat},{lon});
      node["highway"="street_lamp"](around:300,{lat},{lon});
      way["lit"="yes"](around:300,{lat},{lon});
    );
    out tags;
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(OVERPASS_URL, params={'data': query}, timeout=15)
            if response.status_code != 200:
                print(f"Overpass API error: {response.status_code}")
                # Log a bit of the response to see if it's HTML
                print(f"Response preview: {response.text[:100]}")
                return []
            
            # Check if response is empty
            if not response.text.strip():
                return []
                
            data = response.json()
            return data.get('elements', [])
        except Exception as e:
            print(f"Error in get_safety_data: {e}")
            return []

@app.get("/score-route")
async def score_route(start_coords: str, end_coords: str):
    async with httpx.AsyncClient() as client:
        # Request more alternatives if available
        osrm_resp = await client.get(f"{OSRM_URL}{start_coords};{end_coords}?overview=full&geometries=geojson&alternatives=3")
        if osrm_resp.status_code != 200:
            raise HTTPException(status_code=500, detail="Routing engine error")
        
        routes = osrm_resp.json().get('routes', [])
        scored_routes = []

        for route_data in routes:
            coordinates = route_data['geometry']['coordinates']
            if not coordinates:
                continue

            # Sample 5 points along the route for better coverage
            num_samples = 5
            sample_indices = [int(i * (len(coordinates) - 1) / (num_samples - 1)) for i in range(num_samples)]
            sample_points = [coordinates[i] for i in sample_indices]
            
            # Batch safety query for all points in this route
            locations_subquery = ""
            for lon, lat in sample_points:
                locations_subquery += f"""
                  node["amenity"~"police|hospital|pharmacy"](around:300,{lat},{lon});
                  node["highway"="street_lamp"](around:300,{lat},{lon});
                  way["lit"="yes"](around:300,{lat},{lon});
                """
            
            batch_query = f"[out:json][timeout:20];({locations_subquery});out tags;"
            
            async with httpx.AsyncClient() as client:
                try:
                    # Use POST and include a User-Agent to avoid HTTP 406 errors
                    headers = {'User-Agent': 'SafetyNavApp/1.0'}
                    resp = await client.post(OVERPASS_URL, data={'data': batch_query}, timeout=20, headers=headers)
                    if resp.status_code == 200:
                        elements = resp.json().get('elements', [])
                        # Use number of unique safety features to calculate score
                        # 10 features found = +40 points, capped at 100 total
                        safety_bonus = min(len(elements) * 5, 70) 
                        final_score = min(30 + safety_bonus, 100)
                    else:
                        print(f"Batch Overpass Error: {resp.status_code}")
                        final_score = 30 # Base score if API fails
                except Exception as e:
                    print(f"Batch Overpass Exception: {e}")
                    final_score = 30
            
            # Determine Label and Description
            if final_score >= 70:
                color = "#2E7D32" # Safe
                status = "Safe"
                description = "Well-lit & safe features"
            elif final_score >= 40:
                color = "#FBC02D" # Caution
                status = "Caution"
                description = "Moderate safety"
            else:
                color = "#D32F2F" # Avoid
                status = "Avoid"
                description = "Poor lighting/Isolated"

            # Find nearest police station to destination
            dest_lat, dest_lon = sample_points[-1][1], sample_points[-1][0]
            police_query = f'[out:json];node["amenity"="police"](around:2000,{dest_lat},{dest_lon});out body;'
            police_dist = "N/A"
            
            async with httpx.AsyncClient() as client:
                try:
                    p_resp = await client.post(OVERPASS_URL, data={'data': police_query}, timeout=10, headers=headers)
                    if p_resp.status_code == 200:
                        p_elements = p_resp.json().get('elements', [])
                        if p_elements:
                            # Calculate distance to each and find minimum
                            # Using simple distance approximation for small area
                            min_d = float('inf')
                            for p in p_elements:
                                d = ((p['lat'] - dest_lat)**2 + (p['lon'] - dest_lon)**2)**0.5 * 111000 # roughly meters
                                if d < min_d: min_d = d
                            police_dist = f"{int(min_d)}m" if min_d < 1000 else f"{(min_d/1000):.1f}km"
                except:
                    pass

            # Determine Lighting Status
            lighting_status = "Poor"
            if final_score >= 70: lighting_status = "Good"
            elif final_score >= 40: lighting_status = "Fair"

            scored_routes.append({
                "score": final_score,
                "color": color,
                "status": status,
                "description": description,
                "nearby_police": police_dist,
                "lighting_status": lighting_status,
                "geometry": route_data['geometry'],
                "distance_meters": route_data['distance'],
                "duration_seconds": route_data.get('duration', 0)
            })

        # Sort the routes by score descending so the safest is first
        scored_routes.sort(key=lambda x: x['score'], reverse=True)
        return scored_routes

@app.post("/process-fake-call")
async def process_fake_call(file: UploadFile = File(...)):
    try:
        # 1. Save uploaded file to a temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".m4a") as temp_audio:
            temp_audio.write(await file.read())
            temp_path = temp_audio.name

        # 2. Transcribe using Groq Whisper
        with open(temp_path, "rb") as audio_file:
            transcription = client_groq.audio.transcriptions.create(
                file=(temp_path, audio_file.read()),
                model="whisper-large-v3-turbo",
                response_format="text",
            )
        
        # 3. Get AI Response using Groq LLM (Llama 3)
        chat_completion = client_groq.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a protective friend on an emergency fake call. The user is in a potentially unsafe situation and needs to sound like they are having a real conversation. Keep responses short, natural, and supportive. Use phrases like 'I'm almost there', 'Where exactly are you?', 'Stay on the phone with me'. Never break character."
                },
                {
                    "role": "user",
                    "content": transcription
                }
            ],
            model="llama-3.3-70b-versatile",
        )
        
        ai_response = chat_completion.choices[0].message.content
        
        # Cleanup
        os.unlink(temp_path)
        
        return {
            "transcription": transcription,
            "response": ai_response
        }
    except Exception as e:
        print(f"Error processing fake call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

