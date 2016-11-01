console.clear();

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v9',
  center: [-98, 38.88],
  minZoom: 2,
  zoom: 3
});

var overlay = document.getElementById('map-overlay');

// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
  closeButton: false
});

map.on('load', function() {
  // Add the source to query. In this example we're using
  // county polygons uploaded as vector tiles
  map.addSource('counties', {
    "type": "vector",
    "url": "mapbox://mapbox.82pkq93d"
  });

  map.addLayer({
    "id": "counties",
    "type": "fill",
    "source": "counties",
    "source-layer": "original",
    "paint": {
      "fill-outline-color": "rgba(0,0,0,0.1)",
      "fill-color": "rgba(0,0,0,0.1)"
    }
  }, 'place-city-sm'); // Place polygon under these labels.

  map.addLayer({
    "id": "counties-highlighted",
    "type": "fill",
    "source": "counties",
    "source-layer": "original",
    "paint": {
      "fill-outline-color": "#484896",
      "fill-color": "#6e599f",
      "fill-opacity": 0.75
    },
    "filter": ["in", "COUNTY", ""]
  }, 'place-city-sm'); // Place polygon under these labels.

  var FIPS = [];

  map.on('click', function(e) {

    var features = map.queryRenderedFeatures(e.point, {
      layers: ['counties']
    });
    // console.log(e.lngLat);
    var county = features[0].properties.FIPS;

    // if does not contain then push
    if (FIPS.indexOf(county) === -1) {
      FIPS.push(county);
    } else {
      // if contains then splice that index out
      var deleteCount = 1;
      FIPS.splice(FIPS.indexOf(county), deleteCount);

    }

    var baseFilter = ['in', 'FIPS'];
    var filter = baseFilter.concat(FIPS);
    console.log(filter);
    map.setFilter('counties-highlighted', filter);

  });

  map.on('mousemove', function(e) {
    var features = map.queryRenderedFeatures(e.point, {
      layers: ['counties']
    });

    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = features.length ? 'pointer' : '';

    // Remove things if no feature was found.
    if (!features.length) {
      popup.remove();
      // map.setFilter('counties-highlighted', ['in', 'COUNTY', '']);
      overlay.style.display = 'none';
      return;
    }

    // Single out the first found feature on mouseove.
    var feature = features[0];

    // Query the counties layer visible in the map. Use the filter
    // param to only collect results that share the same county name.
    var relatedFeatures = map.querySourceFeatures('counties', {
      sourceLayer: 'original',
      filter: ['in', 'COUNTY', feature.properties.COUNTY]
    });

    // Render found features in an overlay.
    overlay.innerHTML = '';

//     var title = document.createElement('strong');
//     title.textContent = feature.properties.COUNTY;

//     overlay.appendChild(title);
//     overlay.style.display = 'block';

    // Add features that share the same county name to the highlighted layer.
    // map.setFilter('counties-highlighted', ['==', 'COUNTY', feature.properties.COUNTY]);

    // Display a popup with the name of the county
    popup.setLngLat(e.lngLat)
      .setText(feature.properties.COUNTY)
      .addTo(map);
  });
});