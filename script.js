let map, startMarker, endMarker, routeLayer;

function initMap() {
    // Inicializar el mapa centrado en una ubicación general
    map = L.map('map').setView([0, 0], 2);

    // Añadir el mapa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Inicializar el layer para la ruta
    routeLayer = L.layerGroup().addTo(map);

    // Obtener la ubicación actual del usuario y establecer el marcador de inicio
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 13);
            
            // Crear un marcador circular para la ubicación del usuario como punto de partida
            startMarker = L.circleMarker([latitude, longitude], {
                color: 'blue',
                radius: 10
            }).addTo(map)
              .bindPopup("Estás aquí").openPopup();
            
            // Almacenar la ubicación del usuario en el campo de inicio
            document.getElementById('start').value = `${latitude},${longitude}`;
        }, () => alert("No se pudo obtener tu ubicación."));
    }
}

function findRoute() {
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    if (!start || !end) {
        alert("Por favor, ingresa ambos puntos para la ruta.");
        return;
    }

    // Convertir la ubicación en coordenadas
    const startCoords = start.split(',').map(Number);
    const endCoords = end.split(',').map(Number);

    // Limpiar la capa de rutas y el marcador de destino previo
    routeLayer.clearLayers();
    if (endMarker) endMarker.remove();

    // Crear un marcador para el destino
    endMarker = L.marker(endCoords).addTo(map).bindPopup("Destino").openPopup();

    // Usar la API de GraphHopper para obtener la ruta de ida
    fetch(`https://graphhopper.com/api/1/route?point=${start}&point=${end}&vehicle=car&locale=es&key=ea0313bf-ed8e-43de-a131-6b1d2fcde1ef`)
        .then(response => response.json())
        .then(data => {
            // Verificar si se obtuvo una ruta válida
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
