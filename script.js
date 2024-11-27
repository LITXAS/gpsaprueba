let map, userLocation, userCircle, routePolyline, destinationMarker;

function initMap() {
    // Inicializar el mapa centrado en Argentina
    map = L.map('map').setView([-38.4161, -63.6167], 5); // Coordenadas de Argentina

    // Añadir capa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Verificar si la geolocalización está disponible
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(updateUserLocation, handleLocationError, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        });
    } else {
        alert("La geolocalización no está soportada en este navegador.");
    }
}

function updateUserLocation(position) {
    const { latitude, longitude } = position.coords;
    userLocation = L.latLng(latitude, longitude);

    if (!userCircle) {
        // Crear un marcador pequeño (radio mínimo) para la ubicación del usuario
        userCircle = L.circle(userLocation, {
            color: 'blue',
            radius: 10, // Hacer el círculo más pequeño posible
            fillOpacity: 0.7
        }).addTo(map).bindPopup("Estás aquí").openPopup();

        // Centrar el mapa en la ubicación del usuario
        map.setView(userLocation, 13);
    } else {
        // Actualizar la posición del círculo
        userCircle.setLatLng(userLocation);
        map.setView(userLocation, 13); // Centrar el mapa en la nueva ubicación
    }
}

function handleLocationError(error) {
    console.error("Error en la geolocalización:", error);
    alert("No se pudo obtener tu ubicación.");
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
    geocodeDestination(destination)
        .then(destCoords => {
            if (!destCoords) {
                alert("No se encontró el destino.");
                return;
            }

            console.log("Destino geocodificado:", destCoords); // Depuración: Ver las coordenadas obtenidas

            // Si ya existe un marcador de destino, lo eliminamos antes de agregar el nuevo
            if (destinationMarker) {
                map.removeLayer(destinationMarker);
            }

            // Colocar un pin en el lugar de destino
            destinationMarker = L.marker([destCoords.lat, destCoords.lng]).addTo(map)
                .bindPopup("Destino: " + destination)
                .openPopup();

            // API key de GraphHopper
            const apiKey = 'ea0313bf-ed8e-43de-a131-6b1d2fcde1ef';
            const url = `https://graphhopper.com/api/1/route?point=${userLocation.lat},${userLocation.lng}&point=${destCoords.lat},${destCoords.lng}&key=${apiKey}&vehicle=car&locale=es&instructions=false`;

            console.log("URL de la solicitud a GraphHopper:", url); // Depuración: Ver la URL de la solicitud

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.paths && data.paths.length > 0) {
                        const route = data.paths[0];
                        const routeCoordinates = route.points.coordinates.map(coord => [coord[1], coord[0]]); // Convertir a [lat, lng]

                        // Si ya existe una ruta, eliminarla del mapa
                        if (routePolyline) {
                            map.removeLayer(routePolyline);
                        }

                        // Dibujar la ruta como una línea roja en el mapa
                        routePolyline = L.polyline(routeCoordinates, {
                            color: 'red',
                            weight: 5,
                            opacity: 0.8
                        }).addTo(map);

                        // Ajustar la vista del mapa para incluir toda la ruta
                        map.fitBounds(routePolyline.getBounds());
                    } else {
                        alert("No se encontró ninguna ruta.");
                    }
                })
                .catch(err => {
                    console.error("Error al obtener la ruta:", err);
                    alert("Error al obtener la ruta. Verifica el destino ingresado.");
                });
        })
        .catch(err => {
            console.error("Error al geocodificar el destino:", err);
            alert("Error al geocodificar el destino. Inténtalo nuevamente.");
        });
}

// Función para geocodificar el destino
function geocodeDestination(destination) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                // Retornar las coordenadas de la primera coincidencia
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            } else {
                return null; // No se encontró ninguna coincidencia
            }
        });
}

// Inicializar el mapa al cargar la página
window.onload = initMap;
