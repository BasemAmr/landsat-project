import datetime
import requests
import rasterio
import matplotlib.pyplot as plt
from pystac_client import Client
import csv
import os
from geopy.geocoders import Nominatim
from pyorbital.orbital import Orbital
from datetime import timedelta
import rasterio
from rasterio.transform import from_origin
import numpy as np

def initialize_tool():
    print("Welcome to the Enhanced Landsat Data Analysis Tool")
    default_location = "New York City"
    default_lat_long = (40.7128, -74.0060)
    default_date_range = (datetime.date.today() - datetime.timedelta(days=30), datetime.date.today())
    default_cloud_cover_threshold = 15
    return default_location, default_lat_long, default_date_range, default_cloud_cover_threshold

def get_user_input():
    location_input = input("Enter desired location (name, latitude/longitude, or 'map' to select on map): ")
    if location_input.lower() == 'map':
        # Placeholder for map selection functionality
        print("Map selection not implemented. Using default location.")
        user_location = "New York City"
        user_lat_long = (40.7128, -74.0060)
    else:
        try:
            # Check if input is in "lat,long" format
            lat, long = map(float, location_input.split(','))
            user_location = f"{lat}, {long}"
            user_lat_long = (lat, long)
        except ValueError:
            # Assume it's a place name
            geolocator = Nominatim(user_agent="landsat_tool")
            location = geolocator.geocode(location_input)
            if location:
                user_location = location.address
                user_lat_long = (location.latitude, location.longitude)
            else:
                print("Location not found. Using default location.")
                user_location = "New York City"
                user_lat_long = (40.7128, -74.0060)
    
    cloud_cover_threshold = float(input("Enter maximum cloud cover percentage (default 15): ") or 15)
    
    date_range_input = input("Enter date range (YYYY-MM-DD to YYYY-MM-DD) or 'latest' for most recent: ")
    if date_range_input.lower() == 'latest':
        user_date_range = (datetime.date.today() - datetime.timedelta(days=30), datetime.date.today())
    elif date_range_input:
        start_date, end_date = map(lambda x: datetime.datetime.strptime(x.strip(), "%Y-%m-%d").date(), date_range_input.split('to'))
        user_date_range = (start_date, end_date)
    else:
        user_date_range = (datetime.date.today() - datetime.timedelta(days=30), datetime.date.today())
    
    return user_location, user_lat_long, user_date_range, cloud_cover_threshold

def predict_next_overpass(location):
    # This is a simplified prediction and may not be accurate
    landsat = Orbital("Landsat-8")
    now = datetime.datetime.now(datetime.UTC)
    
    # Assuming sea level (0 meters altitude) for prediction
    # You may want to use actual elevation data for more accuracy
    altitude = 0
    
    # Get the next 5 passes to ensure we find at least one
    next_passes = landsat.get_next_passes(now, 5, location[0], location[1], altitude)
    
    if next_passes:
        # Return the first pass (earliest)
        return next_passes[0]
    return None

def set_notification_preferences():
    while True:
        try:
            lead_time = float(input("Enter notification lead time in minutes (can be decimal): "))
            if lead_time < 0:
                print("Lead time must be a positive number.")
                continue
            break
        except ValueError:
            print("Invalid input. Please enter a number.")
    
    while True:
        method = input("Enter notification method (email/sms): ").lower()
        if method in ['email', 'sms']:
            break
        else:
            print("Invalid method. Please enter 'email' or 'sms'.")
    
    return lead_time, method

def display_pixel_grid(scene,user_lat_long):
    print("Scene ID:", scene.id)
    print("Available Assets:", scene.assets.keys())

    # Determine the appropriate asset for the red band
    red_band_asset = next((asset for asset in ['SR_B4', 'red'] if asset in scene.assets), None)
    
    if not red_band_asset:
        print("Surface reflectance data not available for this scene.")
        return None

    scene_url = scene.assets[red_band_asset].href
    print(f"URL for the scene file: {scene_url}")
    
    return scene_url

# def determine_landsat_scene(location):
#     # This is a placeholder. In a real implementation, you would use the WRS-2 system
#     print(f"Landsat scene containing {location}:")
#     print("Path: XXX, Row: YYY")
#     print("Scene extent displayed on map (placeholder)")

def acquire_scene_metadata(scene):
    metadata = {
        "acquisition_date": scene.properties.get("datetime"),
        "cloud_cover": scene.properties.get("eo:cloud_cover"),
        "satellite": scene.properties.get("platform"),
        "path": scene.properties.get("landsat:wrs_path"),
        "row": scene.properties.get("landsat:wrs_row"),
        "quality": scene.properties.get("landsat:quality")
    }
    return metadata

def display_spectral_signature(reflectance_data):
    # افترض أن reflectance_data هو dict، حيث كل مفتاح هو band، والقيمة هي mean reflectance
    band_names = list(reflectance_data.keys())
    reflectance_values = list(reflectance_data.values())

    # تحقق مما إذا كانت القيم صحيحة
    print("Band Names:", band_names)
    print("Reflectance Values:", reflectance_values)

    # استخدم plt.plot لرسم البيانات
    plt.figure(figsize=(10, 6))
    plt.plot(band_names, reflectance_values, 'bo-', label='Mean Reflectance')
    plt.title('Spectral Signature')
    plt.xlabel('Bands')
    plt.ylabel('Mean Reflectance')
    plt.xticks(rotation=45)
    plt.legend()
    plt.grid()
    plt.tight_layout()
    plt.show()


def download_data(data, format='csv'):
    if format == 'csv':
        with open('landsat_data.csv', 'w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(["Band", "Reflectance"])
            for band, value in data.items():
                writer.writerow([band, value])
        print("Data downloaded as landsat_data.csv")
    else:
        print(f"Download format {format} not supported")

def acquire_surface_reflectance(scene):
    print("Available Assets:", scene.assets.keys())
    
    # Mapping of band names to their corresponding asset keys
    band_mapping = {
        'SR_B1': 'coastal',
        'SR_B2': 'blue',
        'SR_B3': 'green',
        'SR_B4': 'red',
        'SR_B5': 'nir08',
        'SR_B6': 'swir16',
        'SR_B7': 'swir22'
    }
    
    # Dictionary to store URLs for each band
    band_urls = {}
    
    for sr_band, asset_key in band_mapping.items():
        if asset_key in scene.assets:
            band_urls[sr_band] = scene.assets[asset_key].href
        else:
            print(f"Warning: {asset_key} not found in scene assets.")
    
    if not band_urls:
        print("No surface reflectance data found for this scene.")
        return None
    
    print("Surface reflectance data URLs acquired:", band_urls)
    return band_urls


def display_reflectance_data(band_urls):
    reflectance_data = {}
    
    # بدلاً من محاولة معالجة البيانات، نقوم بجمع المعلومات المطلوبة فقط
    for band, url in band_urls.items():
        reflectance_data[band] = {
            "url": url,
            "status": "Data available"  # يمكنك إضافة المزيد من المعلومات حسب الحاجة
        }
    
    return reflectance_data


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
        if not items:
            print("No items found for the specified criteria.")
        return items
    except Exception as e:
        print(f"Error fetching  {e}")
        return None

def main():
    default_location, default_lat_long, default_date_range, default_cloud_cover_threshold = initialize_tool()
    user_location, user_lat_long, user_date_range, cloud_cover_threshold = get_user_input()
    
    next_overpass = predict_next_overpass(user_lat_long)
    if next_overpass:
        print(f"Next Landsat overpass: {next_overpass}")
        notify_lead_time, notify_method = set_notification_preferences()
        print(f"You will be notified {notify_lead_time:.2f} minutes before the overpass via {notify_method}")
    else:
        print("Unable to predict next overpass. This could be due to orbital data limitations.")
    
    data = query_landsat_data(user_lat_long, user_date_range, cloud_cover_threshold)

    if data and len(data) > 0:
        selected_scene = data[0]  # Select the first scene for simplicity
        
        print("\nProcessing selected Landsat scene:")
        display_pixel_grid(selected_scene, user_lat_long)
        # determine_landsat_scene(user_location)
        
        metadata = acquire_scene_metadata(selected_scene)
        print("\nScene Meta")
        for key, value in metadata.items():
            print(f"{key}: {value}")
        
        sr_data_url = acquire_surface_reflectance(selected_scene)
        if sr_data_url:
            reflectance_data = display_reflectance_data(sr_data_url)
            display_spectral_signature(reflectance_data)
            
            download_option = input("Do you want to download the data? (y/n): ")
            if download_option.lower() == 'y':
                download_data(dict(zip(["Coastal/Aerosol", "Blue", "Green", "Red", "NIR", "SWIR 1", "SWIR 2"], reflectance_data)))
    else:
        print("No Landsat scenes found matching the specified criteria.")
        print("Try adjusting your search parameters (e.g., wider date range or higher cloud cover threshold).")

if __name__ == "__main__":
    main()