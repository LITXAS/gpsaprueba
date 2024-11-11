let map, routingControl, userLocation, userCircle;

function initMap() {
    // Verificar si la geolocalización está soportada
    if (navigator.geolocation) {
        // Obtener la ubicación inicial del usuario
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            userLocation = L.latLng(latitude, longitude);

            // Inicializar el mapa centrado en la ubicación del usuario
            map = L.map('map').setView(userLocation, 13);

            // Añadir el mapa base
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            // Crear un marcador circular para la ubicación del usuario
            userCircle = L.circle(userLocation, {
                color: 'red',
                radius: 10, // Radio reducido para mejorar precisión visual
                fillOpacity: 0.7
            }).addTo(map).bindPopup("Estás aquí").openPopup();

            // Inicializar el control de rutas con GraphHopper como proveedor de rutas
            routingControl = L.Routing.control({
                waypoints: [userLocation], // Usar la ubicación del usuario como primer waypoint
                router: L.Routing.graphHopper('ea0313bf-ed8e-43de-a131-6b1d2fcde1ef', {
                    urlParameters: {
                        vehicle: 'car',
                        locale: 'es'
                    }
                }),
                routeWhileDragging: true,
                createMarker: function() { return null; } // Sin marcadores por defecto
            }).addTo(map);

            // Rastrear la ubicación en tiempo real del usuario y actualizar el círculo
            navigator.geolocation.watchPosition(updateUserLocation, 
                () => alert("No se pudo obtener tu ubicación en tiempo real."));
        }, 
        () => alert("No se pudo obtener tu ubicación inicial. Verifica los permisos de geolocalización."));
    } else {
        alert("La geolocalización no está soportada en este navegador.");
    }
}

function updateUserLocation(position) {
    const { latitude, longitude } = position.coords;
    const newLocation = L.latLng(latitude, longitude);

    // Actualizar la posición del círculo y el mapa
    userCircle.setLatLng(newLocation);
    map.setView(newLocation);

    // Actualizar el primer waypoint del control de rutas
    if (routingControl) {
        const waypoints = routingControl.getWaypoints();
        waypoints[0].latLng = newLocation;
        routingControl.setWaypoints(waypoints);
    }
}

function searchRoute() {
    const destination = document.getElementById('destination').value;

    if (!userLocation) {
        alert("No se ha detectado tu ubicación.");
        return;
    }

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

        // Establecer los waypoints desde la ubicación del usuario hasta el destino
        routingControl.setWaypoints([userLocation, endCoords]);
    });
}

// Inicializar el mapa al cargar la página
window.onload = initMap;
