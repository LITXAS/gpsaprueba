let map, userLocation, userCircle, routePolyline, destinationMarker;

function initMap() {
    // Inicializar el mapa centrado en Argentina
    map = L.map('map', {
        center: [-38.4161, -63.6167], // Coordenadas de Argentina
        zoom: 5,
        zoomControl: true
    });

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
        // Crear un marcador pequeño para la ubicación del usuario
        userCircle = L.circle(userLocation, {
            color: 'blue',
            radius: 10, // Hacer el círculo pequeño
            fillOpacity: 0.7
        }).addTo(map).bindPopup("Estás aquí").openPopup();

        map.setView(userLocation, map.getZoom());
    } else {
        userCircle.setLatLng(userLocation);
        map.setView(userLocation, map.getZoom());
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

            console.log("Destino geocodificado:", destCoords);

            // Si ya existe un marcador de destino, lo eliminamos antes de agregar el nuevo
            if (destinationMarker) {
                map.removeLayer(destinationMarker);
            }

            // Colocar un marcador en el destino
            destinationMarker = L.marker([destCoords.lat, destCoords.lng]).addTo(map)
                .bindPopup("Destino: " + destination)
                .openPopup();

            // URL de OSRM para obtener la ruta en coche
            const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson`;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.routes && data.routes.length > 0) {
                        const route = data.routes[0];
                        const routeCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

                        // Si ya existe una ruta, eliminarla del mapa
                        if (routePolyline) {
                            map.removeLayer(routePolyline);
                        }

                        // Dibujar la nueva ruta
                        routePolyline = L.polyline(routeCoordinates, {
                            color: 'red',
                            weight: 5,
                            opacity: 0.7
                        }).addTo(map);

                        // Ajustar la vista del mapa para incluir toda la ruta
                        map.fitBounds(routePolyline.getBounds(), { animate: true, duration: 1 });
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
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            } else {
                return null;
            }
        });
}

// Inicializar el mapa al cargar la página
window.onload = initMap;
