let map, routingControl, userLocation, userCircle;

function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            userLocation = L.latLng(latitude, longitude);

            map = L.map('map').setView(userLocation, 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            userCircle = L.circle(userLocation, {
                color: 'red',
                radius: 10,
                fillOpacity: 0.7
            }).addTo(map).bindPopup("Estás aquí").openPopup();

            routingControl = L.Routing.control({
                router: L.Routing.graphHopper('ea0313bf-ed8e-43de-a131-6b1d2fcde1ef', {
                    urlParameters: {
                        vehicle: 'car',
                        locale: 'es'
                    }
                }),
                routeWhileDragging: true,
                createMarker: function() { return null; }
            }).addTo(map);

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

    userCircle.setLatLng(newLocation);
    map.setView(newLocation);
    userLocation = newLocation;

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

    // Llamar a la API de Nominatim para obtener todas las coincidencias
    L.Control.Geocoder.nominatim().geocode(destination, results => {
        if (results.length === 0) {
            alert("No se encontró el destino.");
            return;
        }

        // Crear un menú desplegable con las coincidencias de resultados
        const dropdown = document.getElementById('dropdown');
        dropdown.innerHTML = ''; // Limpiar opciones previas

        results.forEach((result, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${result.name}, ${result.properties.display_name}`;
            dropdown.appendChild(option);
        });

        // Mostrar el menú desplegable
        dropdown.style.display = 'block';

        // Manejar la selección del usuario
        dropdown.onchange = function () {
            const selectedIndex = dropdown.value;
            const endCoords = L.latLng(results[selectedIndex].center.lat, results[selectedIndex].center.lng);

            routingControl.setWaypoints([userLocation, endCoords]);

            // Ocultar el menú después de la selección
            dropdown.style.display = 'none';
        };
    });
}

// Inicializar el mapa al cargar la página
window.onload = initMap;
