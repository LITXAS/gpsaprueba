// Inicialización del mapa centrado en Argentina
const map = L.map('map').setView([-38.4161, -63.6167], 5);

// Capa de mapa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Control de enrutamiento sin marcadores predeterminados
const routingControl = L.Routing.control({
    waypoints: [],
    routeWhileDragging: true,
    createMarker: () => null // Evita marcadores por defecto
}).addTo(map);

let userMarker;
let userPath = [];

// Función para convertir la ciudad a coordenadas y trazar la ruta
function drawRoute() {
    const originCity = document.getElementById('origin').value;
    const destinationCity = document.getElementById('destination').value;
    const geocoder = L.Control.Geocoder.nominatim();

    if (destinationCity) {
        if (!originCity) {
            // Usa la ubicación del usuario como origen si está vacía
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);
                    geocodeDestination(userLatLng, destinationCity);
                },
                (error) => {
                    console.error("Error en la geolocalización:", error);
                    alert("No se pudo obtener la ubicación actual.");
                }
            );
        } else {
            // Geocodifica origen y destino si ambos están disponibles
            geocoder.geocode(originCity, (originResults) => {
                if (originResults.length > 0) {
                    const originLatLng = originResults[0].center;
                    geocodeDestination(originLatLng, destinationCity);
                } else {
                    alert("No se encontró la ubicación de origen.");
                }
            });
        }
    } else {
        alert("Por favor, ingresa una ciudad de destino.");
    }
}

// Función para geocodificar el destino y trazar la ruta con GraphHopper
function geocodeDestination(originLatLng, destinationCity) {
    const geocoder = L.Control.Geocoder.nominatim();
    geocoder.geocode(destinationCity, (destinationResults) => {
        if (destinationResults.length > 0) {
            const destinationLatLng = destinationResults[0].center;

            // Configuración de la API de GraphHopper
            const apiKey = 'ea0313bf-ed8e-43de-a131-6b1d2fcde1ef';
            const url = `https://graphhopper.com/api/1/route?point=${originLatLng.lat},${originLatLng.lng}&point=${destinationLatLng.lat},${destinationLatLng.lng}&key=${apiKey}&vehicle=car&locale=es&instructions=true&calcPoints=true`;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.paths && data.paths.length > 0) {
                        const route = data.paths[0];
                        const routeCoordinates = route.points.coordinates.map(coord => [coord[1], coord[0]]);
                        routingControl.setWaypoints(routeCoordinates.map(coord => L.latLng(coord[0], coord[1])));
                    } else {
                        alert("No se encontró ninguna ruta.");
                    }
                })
                .catch(err => {
                    console.error("Error al obtener la ruta:", err);
                    alert("Error al obtener la ruta.");
                });
        } else {
            alert("No se encontró la ubicación de destino.");
        }
    });
}

// Función para limpiar la ruta del mapa
function clearMap() {
    routingControl.setWaypoints([]);
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    userPath = [];
}

// Función para seguir la ubicación en tiempo real del usuario y agregar un marcador
function trackUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);

                if (!userMarker) {
                    userMarker = L.circleMarker(userLatLng, {
                        color: '#3388ff',
                        radius: 8,
                        weight: 2,
                        fillColor: '#3388ff',
                        fillOpacity: 0.6
                    }).addTo(map).bindPopup("Estás aquí");
                } else {
                    userMarker.setLatLng(userLatLng);
                }

                userPath.push(userLatLng);
                map.setView(userLatLng, 15);
                L.polyline(userPath, { color: 'blue', weight: 3 }).addTo(map);
            },
            (error) => {
                console.error("Error en la geolocalización:", error);
                alert("No se pudo obtener la ubicación actual.");
            },
            { enableHighAccuracy: true }
        );
    } else {
        alert("La geolocalización no está soportada en este navegador.");
    }
}

// Llama a la función para seguir la ubicación del usuario
trackUserLocation();

// Listeners para actualizar la ruta en tiempo real
document.getElementById('origin').addEventListener('input', drawRoute);
document.getElementById('destination').addEventListener('input', drawRoute);
