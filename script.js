let map, userLocation, endMarker, routeLayer;

function initMap() {
    // Inicializar el mapa centrado en una ubicación general (se ajustará cuando obtengamos la ubicación del usuario)
    map = L.map('map').setView([0, 0], 2);

    // Añadir el mapa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Inicializar el layer para la ruta
    routeLayer = L.layerGroup().addTo(map);

    // Obtener la ubicación actual del usuario
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            userLocation = [latitude, longitude];

            // Centrar el mapa en la ubicación del usuario
            map.setView(userLocation, 13);

            // Crear un círculo pequeño en la ubicación del usuario
            L.circle(userLocation, {
                color: 'red',
                radius: 10,  // Radio reducido para mejorar precisión visual
                fillOpacity: 0.7
            }).addTo(map).bindPopup("Estás aquí").openPopup();
        }, () => alert("No se pudo obtener tu ubicación."));
    } else {
        alert("La geolocalización no está soportada en este navegador.");
    }
}

function searchRoute() {
    const end = document.getElementById('end').value;

    if (!userLocation) {
        alert("No se ha detectado tu ubicación.");
        return;
    }

    if (!end) {
        alert("Por favor, ingresa el destino.");
        return;
    }

    // Geocodificar destino
    L.Control.Geocoder.nominatim().geocode(end, endResults => {
        if (endResults.length === 0) {
            alert("No se encontró el destino.");
            return;
        }

        const endCoords = endResults[0].center;

        // Crear marcador de destino
        if (endMarker) endMarker.remove();
        endMarker = L.marker(endCoords).addTo(map).bindPopup("Destino").openPopup();

        // Obtener la ruta
        findRoute(userLocation, endCoords);
    });
}

function findRoute(startCoords, endCoords) {
    // Limpiar capa de ruta
    routeLayer.clearLayers();

    // Usar la API de GraphHopper para obtener la ruta
    fetch(`https://graphhopper.com/api/1/route?point=${startCoords[0]},${startCoords[1]}&point=${endCoords.lat},${endCoords.lng}&vehicle=car&locale=es&key=ea0313bf-ed8e-43de-a131-6b1d2fcde1ef`)
        .then(response => response.json())
        .then(data => {
            if (data.paths && data.paths[0] && data.paths[0].points) {
                const routePoints = data.paths[0].points.coordinates;
                const latLngs = routePoints.map(point => [point[1], point[0]]);

                // Dibujar la ruta en el mapa
                L.polyline(latLngs, { color: 'blue', weight: 5 }).addTo(routeLayer);

                // Ajustar la vista del mapa a la ruta
                map.fitBounds(routeLayer.getBounds());
            } else {
                throw new Error("La API no devolvió una ruta válida.");
            }
        })
        .catch(error => {
            alert("No se pudo obtener la ruta: " + error.message);
        });
}

// Inicializar el mapa al cargar la página
window.onload = initMap;
