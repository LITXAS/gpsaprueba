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
    geocoder: L.Control.Geocoder.nominatim(),
    createMarker: () => null, // Evita marcadores por defecto
}).addTo(map);

let userMarker; // Variable para el marcador circular del usuario
let userPath = []; // Arreglo para almacenar la trayectoria del usuario

// Función para trazar la ruta
function drawRoute() {
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;

    // Configuración de la API de GraphHopper
    const apiKey = 'ea0313bf-ed8e-43de-a131-6b1d2fcde1ef';
    const url = `https://graphhopper.com/api/1/route?point=${origin}&point=${destination}&key=${apiKey}&vehicle=car&locale=es&instructions=true&calcPoints=true`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.paths && data.paths.length > 0) {
                const route = data.paths[0];
                const routeCoordinates = route.points.coordinates.map(coord => [coord[1], coord[0]]); // Convierte a [lat, lng]
                routingControl.setWaypoints(routeCoordinates.map(coord => L.latLng(coord[0], coord[1])));
            } else {
                alert("No se encontró ninguna ruta.");
            }
        })
        .catch(err => {
            console.error("Error al obtener la ruta: ", err);
            alert("Error al obtener la ruta. Verifica los nombres de las ciudades.");
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

// Función para centrar el mapa en la ubicación del usuario en tiempo real
function trackUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);

                // Si el marcador circular del usuario no existe, lo creamos
                if (!userMarker) {
                    userMarker = L.circleMarker(userLatLng, {
                        color: '#3388ff',
                        radius: 8,
                        weight: 2,
                        fillColor: '#3388ff',
                        fillOpacity: 0.6
                    }).addTo(map).bindPopup("Estás aquí");
                } else {
                    // Actualiza la posición del marcador circular
                    userMarker.setLatLng(userLatLng);
                }

                // Añadir la posición a la trayectoria del usuario
                userPath.push(userLatLng);

                // Centra el mapa en la posición del usuario
                map.setView(userLatLng, 15);

                // Dibuja la trayectoria del usuario en el mapa
                L.polyline(userPath, { color: 'blue', weight: 3 }).addTo(map);
            },
            (error) => {
                console.error("Error en la geolocalización: ", error);
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
