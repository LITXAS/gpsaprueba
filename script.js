let map, routingControl, userLocation, userCircle;

function initMap() {
    // Verificar si la geolocalización está soportada
    if (navigator.geolocation) {
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
                radius: 10,
                fillOpacity: 0.7
            }).addTo(map).bindPopup("Estás aquí").openPopup();

            // Inicializar el control de rutas con estilos personalizados
            routingControl = L.Routing.control({
                router: L.Routing.graphHopper('ea0313bf-ed8e-43de-a131-6b1d2fcde1ef', {
                    urlParameters: {
                        vehicle: 'car',
                        locale: 'es'
                    }
                }),
                routeWhileDragging: false,
                addWaypoints: true, // Permitir agregar waypoints dinámicos
                lineOptions: {
                    styles: [{ color: 'blue', opacity: 0.7, weight: 5 }] // Línea azul personalizada
                },
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

    // Actualizar la ubicación del usuario
    userLocation = newLocation;

    // Actualizar el primer waypoint del control de rutas si ya hay una ruta en curso
    if (routingControl.getWaypoints().length > 1) {
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

        // Marcar el destino en el mapa (opcional)
        L.marker(endCoords).addTo(map).bindPopup("Destino").openPopup();

        // Establecer los waypoints desde la ubicación actual del usuario hasta el destino
        routingControl.setWaypoints([userLocation, endCoords]);

        // Verificar que los waypoints se establecieron correctamente
        console.log("Waypoints establecidos:", routingControl.getWaypoints());
    });
}

// Inicializar el mapa al cargar la página
window.onload = initMap;
