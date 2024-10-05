from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime
from pystac_client import Client
from geopy.geocoders import Nominatim
from pyorbital.orbital import Orbital

app = Flask(__name__)
CORS(app) 

def predict_next_overpass(location):
    landsat = Orbital("Landsat-8")
    now = datetime.datetime.now(datetime.UTC)
    altitude = 0
    next_passes = landsat.get_next_passes(now, 5, location[0], location[1], altitude)
    return next_passes[0] if next_passes else None

def query_landsat_data(location, date_range, cloud_cover):
    landsat_stac = Client.open("https://landsatlook.usgs.gov/stac-server")
    try:
        search = landsat_stac.search(
            intersects={"type": "Point", "coordinates": [location[1], location[0]]},
            datetime=f"{date_range[0]}/{date_range[1]}",
            collections=["landsat-c2l2-sr"],
            query={"eo:cloud_cover": {"lt": cloud_cover}}
        )
        items = list(search.get_items())
        return items
    except Exception as e:
        print(f"Error fetching: {e}")
        return None

def acquire_scene_metadata(scene):
    return {
        "acquisition_date": scene.properties.get("datetime"),
        "cloud_cover": scene.properties.get("eo:cloud_cover"),
        "satellite": scene.properties.get("platform"),
        "path": scene.properties.get("landsat:wrs_path"),
        "row": scene.properties.get("landsat:wrs_row"),
        "quality": scene.properties.get("landsat:quality")
    }

def acquire_surface_reflectance(scene):
    band_mapping = {
        'SR_B1': 'coastal', 'SR_B2': 'blue', 'SR_B3': 'green', 'SR_B4': 'red',
        'SR_B5': 'nir08', 'SR_B6': 'swir16', 'SR_B7': 'swir22'
    }
    band_urls = {sr_band: scene.assets[asset_key].href 
                 for sr_band, asset_key in band_mapping.items() 
                 if asset_key in scene.assets}
    return band_urls if band_urls else None

@app.route('/analyze_landsat', methods=['POST'])
def analyze_landsat():
    data = request.json
    location_input = data.get('location')
    cloud_cover_threshold = data.get('cloud_cover', 15)
    date_range_input = data.get('date_range', 'latest')

    # Process location input
    geolocator = Nominatim(user_agent="landsat_tool")
    try:
        lat, lon = map(float, location_input.split(','))
    except ValueError:
        location = geolocator.geocode(location_input)
        if location:
            lat, lon = location.latitude, location.longitude
        else:
            return jsonify({"error": "Invalid location"}), 400

    # Process date range
    if date_range_input == 'latest':
        end_date = datetime.date.today()
        start_date = end_date - datetime.timedelta(days=30)
    else:
        try:
            start_date, end_date = map(lambda x: datetime.datetime.strptime(x.strip(), "%Y-%m-%d").date(), date_range_input.split('to'))
        except ValueError:
            return jsonify({"error": "Invalid date range format"}), 400

    # Predict next overpass
    next_overpass = predict_next_overpass((lat, lon))

    # Query Landsat data
    landsat_scenes = query_landsat_data((lat, lon), (start_date, end_date), cloud_cover_threshold)

    if not landsat_scenes:
        return jsonify({"error": "No Landsat scenes found matching the criteria"}), 404

    selected_scene = landsat_scenes[0]
    metadata = acquire_scene_metadata(selected_scene)
    band_urls = acquire_surface_reflectance(selected_scene)

    if not band_urls:
        return jsonify({"error": "No surface reflectance data available for this scene"}), 404

    result = {
        "location": f"{lat}, {lon}",
        "next_overpass": str(next_overpass) if next_overpass else "Unable to predict",
        "scene_metadata": metadata,
        "reflectance_data": band_urls
    }

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)