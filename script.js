let map, routingControl;

function initMap() {
    // Inicializar el mapa centrado en una ubicación general
    map = L.map('map').setView([0, 0], 2);

    // Añadir el mapa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Inicializar el control de rutas con Leaflet Routing Machine
    routingControl = L.Routing.control({
        waypoints: [],
        routeWhileDragging: true,
        geocoder: L.Control.Geocoder.nominatim(),
        createMarker: function() { return null; } // Sin marcadores de ruta por defecto
    }).addTo(map);

    // Obtener la ubicación actual del usuario
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            const userLocation = L.latLng(latitude, longitude);

            // Centrar el mapa en la ubicación del usuario
            map.setView(userLocation, 13);

            // Crear un círculo pequeño en la ubicación del usuario
            L.circle(userLocation, {
                color: 'red',
                radius: 10,
                fillOpacity: 0.7
            }).addTo(map).bindPopup("Estás aquí").openPopup();

            // Configurar el primer waypoint en la ubicación del usuario
            routingControl.setWaypoints([userLocation]);
        }, () => alert("No se pudo obtener tu ubicación."));
    } else {
        alert("La geolocalización no está soportada en este navegador.");
    }
}

function searchRoute() {
    const destination = document.getElementById('destination').value;

    if (!destination) {
        alert("Por favor, ingresa el destino.");
        return;
    }

    // Geocodificar el destino
    L.Control.Geocoder.nominatim().geocode(destination, results => {
        if (results.length === 0) {
            alert("No se encontró el destino.");
            return;
        }

        const endCoords = L.latLng(results[0].center.lat, results[0].center.lng);

        // Añadir el destino a los waypoints para trazar la ruta
        routingControl.spliceWaypoints(routingControl.getWaypoints().length - 1, 1, endCoords);
    });
}

// Inicializar el mapa al cargar la página
window.onload = initMap;
