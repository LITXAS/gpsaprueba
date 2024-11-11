const map = L.map('map').setView([-38.4161, -63.6167], 5); // Centra el mapa en Argentina

// Capa de mapa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Configuración de la capa de enrutamiento sin dependencia de API
const routingControl = L.Routing.control({
    waypoints: [],
    routeWhileDragging: true,
    createMarker: function() { return null; } // No crear marcadores por defecto
}).addTo(map);

// Función para establecer los puntos de origen y destino en el mapa
function setRoutePoints() {
    const originInput = document.getElementById('origin').value;
    const destinationInput = document.getElementById('destination').value;

    if (!originInput || !destinationInput) {
        alert("Por favor ingresa ambos puntos: origen y destino.");
        return;
    }

    // Convertir las ubicaciones a latitudes y longitudes ingresadas en formato "lat,lng" por el usuario
    const originCoords = originInput.split(',').map(Number);
    const destinationCoords = destinationInput.split(',').map(Number);

    if (originCoords.length === 2 && destinationCoords.length === 2) {
        const origin = L.latLng(originCoords[0], originCoords[1]);
        const destination = L.latLng(destinationCoords[0], destinationCoords[1]);

        // Configurar los waypoints en el mapa
        routingControl.setWaypoints([origin, destination]);
    } else {
        alert("Formato incorrecto. Ingresa coordenadas en formato 'lat,lng' para ambas ubicaciones.");
    }
}

// Función para limpiar los puntos de ruta en el mapa
function clearMap() {
    routingControl.setWaypoints([]);
}
