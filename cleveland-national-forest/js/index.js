var bounds = [     // WSEN
    [-116.9,32.6], // Southwest coordinates
    [-116.4,33.0]  // Northeast coordinates
];

var map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/roblabs/ciqk2376r000lb9m98hmyzwr7',
  center: [-116.4317, 32.8611],
  zoom: 14,
  maxBounds: bounds
});