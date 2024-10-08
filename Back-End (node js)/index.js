const express = require('express');
const axios = require('axios');
const NodeGeocoder = require('node-geocoder');
const satellite = require('satellite.js');
const cors = require('cors');
const moment = require('moment');
const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());

// إعداد geocoder
const geocoder = NodeGeocoder({
    provider: 'openstreetmap'
});

// حساب مرور القمر الصناعي
function predictNextOverpass(lat, lon) {
    const tleLine1 = '1 43013U 17073A   20334.91667824  .00000023  00000-0  00000+0 0  9994'; // TLE Line 1 for Landsat-8
    const tleLine2 = '2 43013  97.7421  34.8470 0001432  91.5763 268.5523 14.57178936188308'; // TLE Line 2 for Landsat-8
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    
    const date = new Date();
    const positionAndVelocity = satellite.propagate(satrec, date);
    const positionEci = positionAndVelocity.position;
    const gmst = satellite.gstime(date);
    const positionGd = satellite.eciToGeodetic(positionEci, gmst);
    const longitude = satellite.degreesLong(positionGd.longitude);
    const latitude = satellite.degreesLat(positionGd.latitude);

    return { lat: latitude, lon: longitude };
}

// البحث عن بيانات Landsat
async function queryLandsatData(lat, lon, dateRange, cloudCover) {
    try {
        const stacServer = 'https://landsatlook.usgs.gov/stac-server';
        const response = await axios.post(`${stacServer}/search`, {
            intersects: {
                type: "Point",
                coordinates: [lon, lat]
            },
            datetime: `${dateRange[0]}/${dateRange[1]}`,
            collections: ["landsat-c2l2-sr"],
            query: { "eo:cloud_cover": { "lt": cloudCover } }
        });
        
        return response.data.features; // المشاهد المطابقة
    } catch (error) {
        console.error('Error fetching Landsat data:', error);
        return null;
    }
}

// استرجاع بيانات المشهد
function acquireSceneMetadata(scene) {
    return {
        acquisition_date: scene.properties.datetime,
        cloud_cover: scene.properties['eo:cloud_cover'],
        satellite: scene.properties.platform,
        path: scene.properties['landsat:wrs_path'],
        row: scene.properties['landsat:wrs_row'],
        quality: scene.properties['landsat:quality']
    };
}

// استرجاع بيانات الانعكاس السطحي
function acquireSurfaceReflectance(scene) {
    const bandMapping = {
        'SR_B1': 'coastal', 'SR_B2': 'blue', 'SR_B3': 'green', 'SR_B4': 'red',
        'SR_B5': 'nir08', 'SR_B6': 'swir16', 'SR_B7': 'swir22'
    };
    const bandUrls = {};
    
    for (const [srBand, assetKey] of Object.entries(bandMapping)) {
        if (scene.assets[assetKey]) {
            bandUrls[srBand] = scene.assets[assetKey].href;
        }
    }
    
    return bandUrls;
}

// Endpoint لتحليل بيانات Landsat
app.post('/analyze_landsat', async (req, res) => {
    const { location, cloud_cover = 15, date_range = 'latest' } = req.body;
    
    let lat, lon;
    
    // معالجة الموقع
    try {
        if (location.includes(',')) {
            [lat, lon] = location.split(',').map(coord => parseFloat(coord.trim()));
        } else {
            const geoRes = await geocoder.geocode(location);
            if (geoRes.length === 0) return res.status(400).json({ error: 'Invalid location' });
            lat = geoRes[0].latitude;
            lon = geoRes[0].longitude;
        }
    } catch (error) {
        return res.status(400).json({ error: 'Invalid location format' });
    }

    // معالجة نطاق التاريخ
    let startDate, endDate;
    if (date_range === 'latest') {
        endDate = moment().format('YYYY-MM-DDT23:59:59Z');
        startDate = moment().subtract(30, 'days').format('YYYY-MM-DDT00:00:00Z');
    } else {
        try {
            [startDate, endDate] = date_range.split('to').map(d => moment(d.trim(), 'YYYY-MM-DD').format('YYYY-MM-DD'));
            startDate = moment(startDate).format('YYYY-MM-DDT00:00:00Z');
            endDate = moment(endDate).format('YYYY-MM-DDT23:59:59Z');
        } catch (error) {
            return res.status(400).json({ error: 'Invalid date range format' });
        }
    }

    // توقع مرور القمر الصناعي
    const nextOverpass = predictNextOverpass(lat, lon);

    // جلب مشاهد Landsat
    const landsatScenes = await queryLandsatData(lat, lon, [startDate, endDate], cloud_cover);
    if (!landsatScenes || landsatScenes.length === 0) {
        return res.status(404).json({ error: 'No Landsat scenes found matching the criteria' });
    }

    const selectedScene = landsatScenes[0];
    const metadata = acquireSceneMetadata(selectedScene);
    const bandUrls = acquireSurfaceReflectance(selectedScene);

    if (Object.keys(bandUrls).length === 0) {
        return res.status(404).json({ error: 'No surface reflectance data available for this scene' });
    }

    // النتيجة النهائية
    const result = {
        location: `${lat}, ${lon}`,
        next_overpass: nextOverpass ? nextOverpass : "Unable to predict",
        scene_metadata: metadata,
        reflectance_data: bandUrls
    };

    return res.json(result);
});

// تشغيل الخادم
app.listen(PORT, () => {
    console.log('Server is running on http://localhost:' + PORT);
});
