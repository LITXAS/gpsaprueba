let map, startMarker, endMarker, routeLayer;

function initMap() {
    // Inicializar el mapa centrado en una ubicación general
    map = L.map('map').setView([40.416775, -3.703790], 6); // Centrado en España

    // Añadir el mapa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Inicializar el layer para la ruta
    routeLayer = L.layerGroup().addTo(map);
}

function searchRoute() {
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    if (!start || !end) {
        alert("Por favor, ingresa ambos puntos para la ruta.");
        return;
    }

    // Geocodificar punto de inicio
    L.Control.Geocoder.nominatim().geocode(start, startResults => {
        if (startResults.length === 0) {
            alert("No se encontró el punto de inicio.");
            return;
        }

        const startCoords = startResults[0].center;

        // Crear marcador de inicio
        if (startMarker) startMarker.remove();
        startMarker = L.marker(startCoords).addTo(map).bindPopup("Inicio").openPopup();

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
            findRoute(startCoords, endCoords);
        });
    });
}

function findRoute(startCoords, endCoords) {
    // Limpiar capa de ruta
    routeLayer.clearLayers();

    // Usar la API de GraphHopper para obtener la ruta
    fetch(`https://graphhopper.com/api/1/route?point=${startCoords.lat},${startCoords.lng}&point=${endCoords.lat},${endCoords.lng}&vehicle=car&locale=es&key=tu_api_key_aqui`)
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
