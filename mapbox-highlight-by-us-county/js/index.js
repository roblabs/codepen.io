/*jshint esversion: 6 */
console.clear();

var database = firebase.database();
var filter;
var databaseEndpoint = '/';

var geojson = featureCollection([]);
var FIPS = [];
var baseFilter = ['in', 'FIPS'];
var currentColor = "#ffffcc";
var byColor;

var paletteColors = [
  '#ffffcc',
  '#a1dab4',
  '#41b6c4',
  '#2c7fb8',
  '#253494',
  '#fed976',
  '#feb24c',
  '#fd8d3c',
  '#f03b20',
  '#bd0026'
];

// Mapbox map
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

  paletteColors.forEach(function(color) {
    lay = addLayer(color);
    map.addLayer(lay, 'place-city-sm'); // Place polygon under these labels.)
  });


  map.addLayer({
    "id": "counties-highlighted",
    "type": "fill",
    "source": "counties",
    "source-layer": "original",
    "paint": {
      "fill-outline-color": "#888888",
      "fill-color": currentColor,
      "fill-opacity": 0.75
    },
    "filter": ["in", "COUNTY", ""]
  }, 'place-city-sm'); // Place polygon under these labels.

  // Database
  var databaseObject = [];
  var starCountRef = firebase.database().ref(databaseEndpoint);
  starCountRef.once('value', function(snapshot) {

    if (snapshot.val() !== null) {
      databaseObject = snapshot.val();
      // the endpoint, or name of the object in the database is 'geojson/'
      //   so simplifiy the name by extracting the data by the name of 'geojson'
      geojson = databaseObject.geojson;
      console.log(geojson);
      byColor = getFIPSByColor(geojson);
      console.log(byColor);

      byColor.forEach(function(colorRow) {
        color = colorRow.color;
        console.log(color);
        rawCurrentColor = rawColorValue(color);
        layer = 'counties-highlighted-' + rawCurrentColor;

        filter = baseFilter;
        filter = filter.concat(colorRow.FIPS);
        console.log(layer);
        console.log(filter);

        map.setFilter(layer, filter);
        map.setPaintProperty(layer, 'fill-color', color);
      });
    }
  });

  map.on('click', function(e) {
    console.log('click');

    var features = map.queryRenderedFeatures(e.point, {
      layers: ['counties']
    });
    // console.log(e.lngLat);
    f = feature([e.lngLat.lng, e.lngLat.lat]);

    f.properties["fill-color"] = currentColor;
    f.properties.FIPS = features[0].properties.FIPS;

    rawCurrentColor = rawColorValue(currentColor);
    layer = 'counties-highlighted-' + rawCurrentColor;

    // add the new clicked feature to the geojson
    geojson = updateGeojson(geojson, f);

    // // set the colors based on the data
    // fips = getFips();
    // console.log("onclick fips = ");
    // console.log(fips);

    map.setFilter(layer, filter);
    map.setPaintProperty(layer, 'fill-color', currentColor);

    // update the database
    firebase.database().ref(databaseEndpoint).set({
      geojson: geojson
    });

    // var county = features[0].properties.FIPS;
    //     // if does not contain then push
    //     if (filter.indexOf(county) === -1) {
    //       console.log("adding county");
    //       filter = filter.concat(county);
    //     } else {
    //       // if contains then splice that index out
    //       var deleteCount = 1;
    //       filter.splice(filter.indexOf(county), deleteCount);
    //     }
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
      // overlay.style.display = 'none';
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
    // overlay.innerHTML = '';

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

// GeoJson objects

// main geojson key
function featureCollection(f) {
  return {
    type: 'FeatureCollection',
    features: f
  };
}

// generate a geojson feature
function feature(geom) {
  return {
    type: 'Feature',
    geometry: geom,
    properties: properties()
  };
}

//  expects [longitude, latitude]
function point(coordinates) {
  return {
    type: 'Point',
    coordinates: coordinates
  };
}

// fill in the properites keys/values here
function properties() {
  return {
    "fill-color": "#ff0000",
    "tags": "",
    "FIPS": null
  };
}

function updateGeojson(geoJsonObject, feature) {

  var features = geoJsonObject.features;
  features.push(feature);

  return featureCollection(features);
}

function getFIPS(geojson) {
  let filter = ['in', 'FIPS'];
  for (let f of geojson.features) {
    filter.push(f.properties.FIPS);
  }
  return filter;
}

function getFIPSByColor(geojson) {

  value = [];
  colors = [];

  // first create an array, pushing only unique colors
  for (var f of geojson.features) {
    fillColor = f.properties['fill-color'];

    // add only unique colors to this array
    if (colors.indexOf(fillColor) == -1) {
      colors.push(fillColor);
    }
  }
  console.log("getFIPSByColor(), unique colors in geojson");
  console.log(colors);

  // now iterate overall features, again, to add FIPS
  for (var c of colors) {
    uniqueFips = [];

    for (var ff of geojson.features) {
      fillColor = ff.properties['fill-color'];
      FIPS = ff.properties.FIPS;

      if (c == fillColor) {
        // color exists, so push only the FIPS value
        uniqueFips.push(FIPS);
      }
    }

    colorFIPS = {
      color: '#123456',
      FIPS: []
    };

    colorFIPS.color = c;
    colorFIPS.FIPS = uniqueFips;

    value.push(colorFIPS);
  }

  return value;
}

function findByColor(colors, findColor) {
  for (var c of colors) {
    if (findColor == c.color) {
      return c.FIPS;
      break;
    }
  }
}

function getFips() {
  // set the colors based on the data
  byColor = getFIPSByColor(geojson);

  fips = findByColor(byColor, currentColor);

  filter = baseFilter;
  filter = filter.concat(fips);

  return fips;
}

////
/// color picker
////

var swatches = document.getElementById('swatches');
// var layer = document.getElementById('layer');

paletteColors.forEach(function(color) {

  var swatch = document.createElement('button');
  swatch.style.backgroundColor = color;
  swatch.addEventListener('click', function() {

    currentColor = color;
    console.log("currentColor = " + currentColor);

    //     rawCurrentColor = rawColorValue(currentColor);
    //     layer = 'counties-highlighted-' + rawCurrentColor;

    //     map.setFilter(layer, filter);
    //     map.setPaintProperty(layer, 'fill-color', currentColor);
  });
  swatches.appendChild(swatch);

});

function rawColorValue(color) {
  // color looks like #123456
  //   strip off the '#'
  return color.split('#')[1];
}

function addLayer(color) {

  var colorValue = rawColorValue(color);

  var layer = {
    "id": "counties-highlighted-" + colorValue,
    "type": "fill",
    "source": "counties",
    "source-layer": "original",
    "paint": {
      "fill-outline-color": "#888888",
      "fill-color": color,
      "fill-opacity": 0.75
    },
    "filter": [
      "in",
      "COUNTY",
      ""
    ]
  };

  return layer;
}