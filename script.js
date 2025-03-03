// script.js
let map, userMarker, routeLayer, destinationMarker;
let searchHistory = [];

function initMap() {
    map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            })
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([-63.6167, -38.4161]),
            zoom: 5
        })
    });

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(updateUserLocation, handleLocationError, {
            enableHighAccuracy: true
        });
    } else {
        alert("La geolocalización no está soportada en este navegador.");
    }
    
    document.addEventListener('click', function(event) {
        const historyContainer = document.getElementById('history-container');
        const historyButton = document.querySelector('[onclick="showHistory()"]');
        
        if (!historyContainer.contains(event.target) && event.target !== historyButton) {
            historyContainer.style.display = 'none';
        }
    });
}

function updateUserLocation(position) {
    const { latitude, longitude } = position.coords;
    const userCoords = ol.proj.fromLonLat([longitude, latitude]);
    
    if (!userMarker) {
        userMarker = new ol.Feature({
            geometry: new ol.geom.Point(userCoords)
        });
        
        const vectorSource = new ol.source.Vector({
            features: [userMarker]
        });
        
        const vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({ color: 'blue' })
                })
            })
        });
        
        map.addLayer(vectorLayer);
        map.getView().setCenter(userCoords);
    } else {
        userMarker.getGeometry().setCoordinates(userCoords);
    }
}

function showHistory() {
    const historyContainer = document.getElementById('history-container');
    historyContainer.style.display = historyContainer.style.display === 'block' ? 'none' : 'block';
}

function searchRoute() {
    const destination = document.getElementById('destination').value;
    if (!destination) {
        alert("Por favor, ingresa un destino.");
        return;
    }

    geocodeDestination(destination).then(destCoords => {
        if (!destCoords) {
            alert("Destino no encontrado.");
            return;
        }
        
        const userCoords = userMarker.getGeometry().getCoordinates();
        const destPoint = ol.proj.fromLonLat([parseFloat(destCoords.lng), parseFloat(destCoords.lat)]);

        if (destinationMarker) {
            destinationMarker.getGeometry().setCoordinates(destPoint);
        } else {
            destinationMarker = new ol.Feature({
                geometry: new ol.geom.Point(destPoint)
            });
            
            const vectorSource = new ol.source.Vector({
                features: [destinationMarker]
            });
            
            const vectorLayer = new ol.layer.Vector({
                source: vectorSource,
                style: new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                        scale: 0.05
                    })
                })
            });
            
            map.addLayer(vectorLayer);
        }

        fetch(`https://router.project-osrm.org/route/v1/driving/${ol.proj.toLonLat(userCoords).join(',')};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson`)
            .then(response => response.json())
            .then(data => {
                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0].geometry;
                    const format = new ol.format.GeoJSON();
                    const routeFeature = format.readFeature({
                        type: 'Feature',
                        geometry: route
                    }, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: 'EPSG:3857'
                    });

                    if (routeLayer) {
                        map.removeLayer(routeLayer);
                    }
                    
                    routeLayer = new ol.layer.Vector({
                        source: new ol.source.Vector({ features: [routeFeature] }),
                        style: new ol.style.Style({
                            stroke: new ol.style.Stroke({ color: 'red', width: 3 })
                        })
                    });
                    map.addLayer(routeLayer);
                    
                    displayRouteInfo(data.routes[0].distance, data.routes[0].duration);
                    saveToHistory(destination, data.routes[0].distance, data.routes[0].duration);
                }
            });
    });
}

function displayRouteInfo(distance, duration) {
    const infoDiv = document.getElementById('route-info');
    infoDiv.innerHTML = `
        <strong>Distancia:</strong> ${(distance / 1000).toFixed(2)} km<br>
        <strong>Tiempo estimado:</strong> ${(duration / 60).toFixed(2)} min
    `;
}

function saveToHistory(destination, distance, duration) {
    searchHistory.push({ destination, distance, duration });
    updateHistoryList();
}

function updateHistoryList() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    searchHistory.forEach((route, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${route.destination}</strong><br>
            Distancia: ${(route.distance / 1000).toFixed(2)} km<br>
            Tiempo: ${(route.duration / 60).toFixed(2)} min
        `;
        historyList.appendChild(li);
    });
}

function geocodeDestination(destination) {
    return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${destination}`)
        .then(response => response.json())
        .then(data => data.length > 0 ? { lat: data[0].lat, lng: data[0].lon } : null);
}

function handleLocationError(error) {
    console.error("Error en la geolocalización:", error);
    alert("No se pudo obtener tu ubicación.");
}

initMap();
