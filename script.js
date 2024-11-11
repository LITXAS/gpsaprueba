let map, routingControl, userLocation, userCircle;

function initMap() {
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

            // Inicializar el control de rutas
            routingControl = L.Routing.control({
                waypoints: [],
                routeWhileDragging: true,
                show: false,
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

    // Geocodificar el destino usando Nominatim
    L.Control.Geocoder.nominatim().geocode(destination, results => {
        if (results.length === 0) {
            alert("No se encontró el destino.");
            return;
        }

        const endCoords = L.latLng(results[0].center.lat, results[0].center.lng);

        // API de GraphHopper para obtener instrucciones detalladas
        const apiKey = 'ea0313bf-ed8e-43de-a131-6b1d2fcde1ef';
    const url = `https://graphhopper.com/api/1/route?point=${origin}&point=${destination}&key=${apiKey}&vehicle=car&locale=es&instructions=true&calcPoints=true`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.paths && data.paths.length > 0) {
                    const route = data.paths[0];
                    const routeCoordinates = route.points.coordinates.map(coord => [coord[1], coord[0]]);

                    // Configurar los waypoints de la ruta en el control de rutas
                    routingControl.setWaypoints([userLocation, endCoords]);

                    // Mostrar instrucciones paso a paso
                    displayRouteInstructions(route.instructions);
                } else {
                    alert("No se encontró ninguna ruta.");
                }
            })
            .catch(err => {
                console.error("Error al obtener la ruta: ", err);
                alert("Error al obtener la ruta. Verifica los nombres de las ciudades.");
            });
    });
}

// Función para mostrar las instrucciones paso a paso
function displayRouteInstructions(instructions) {
    const instructionsContainer = document.getElementById('instructions');
    instructionsContainer.innerHTML = ''; // Limpiar instrucciones previas

    instructions.forEach((instruction, index) => {
        const step = document.createElement('div');
        step.innerHTML = `${index + 1}. ${instruction.text} - ${instruction.distance.toFixed(0)} m`;
        instructionsContainer.appendChild(step);
    });

    // Mostrar el contenedor de instrucciones
    instructionsContainer.style.display = 'block';
}

// Función para limpiar el mapa
function clearMap() {
    routingControl.setWaypoints([]);
    document.getElementById('instructions').style.display = 'none';
}

// Inicializar el mapa al cargar la página
window.onload = initMap;
