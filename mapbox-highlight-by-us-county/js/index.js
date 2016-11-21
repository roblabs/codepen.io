/*jshint esversion: 6 */ /*jslint single*/
console.clear();

// Firebase
var database = firebase.database();
var databaseEndpoint = '/production/';

// GeoJSON objects
var geojson = featureCollection([]);
var POINTS = []; // city points
var FEATURE = null; // create empty feature
var FEATURE_INDEX = null;
var TAGS = [];

// User interface and filters
var CHECKBOX;
var FIPS = []; // FIPS are unique codes for a county
var tags = [];
var filter;
var baseFilter = ['in', 'FIPS'];

// Settings for Constants, colors and timeouts
var mouseOverDelay = 200; // milliseconds delay before showing popup
var setTimeoutConst;
var colorHighlightedCounty = "#888888";
var OPACITY = 0.5;
var paletteColors = [
  '#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494',
  '#fed976', '#feb24c', '#fd8d3c', '#f03b20', '#bd0026'
];

// http://stackoverflow.com/a/36253499
function hexToRGBA(hex, opacity) {
  return 'rgba(' + (hex = hex.replace('#', '')).match(new RegExp('(.{' + hex.length / 3 + '})', 'g')).map(function(l) {
    return parseInt(hex.length % 2 ? l + l : l, 16);
  }).concat(opacity || 1).join(',') + ')';
}

// Mapbox map
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/roblabs/civlfb2h1009g2kpibfezqs4p',
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

  map.addSource("points", {
    "type": "geojson",
    "data": {
      "type": "FeatureCollection",
      "features": []
    }
  });

  map.addLayer({
    "id": "points",
    "type": "symbol",
    "source": "points",
    "layout": {
      "icon-image": "marker-{color}-15"
    }
  });

  paletteColors.forEach(function(color) {
    lay = addLayer(color);
    map.addLayer(lay, 'place-city-sm'); // Place polygon under these labels.
  });

  // Border highlighted layer
  map.addLayer(addCountyBorderLayer(), 'place-city-sm');

  // User interface
  CHECKBOX = $('input[name="city-county-checkbox"]').bootstrapSwitch('state');

  // Database
  var databaseObject = [];
  var rootRef = firebase.database().ref(databaseEndpoint);
  rootRef.once('value', function(snapshot) {

    if (snapshot.val() !== null) {
      databaseObject = snapshot.val();
      // the endpoint, or name of the object in the database is 'geojson/'
      //   so simplifiy the name by extracting the data by the name of 'geojson'
      geojson = databaseObject.geojson;

      if (geojson.features !== undefined) {
        setPaintColors(geojson);
        updatePOINTS(geojson);
      } else { // data base is NOT empty, but has no features
        geojson = featureCollection([]);
      }

    } else { // data base is empty
      geojson = featureCollection([]);
    }
  });

  map.on('click', function(e) {
    console.log('click');

    // Since we clicked on a new feature, nullify the previous one
    FEATURE = null;
    FEATURE_INDEX = null;

    // Create a new GeoJson feature and properties
    let p = point([e.lngLat.lng, e.lngLat.lat]);
    FEATURE = feature(p);

    if (CHECKBOX === true) { // City

      // TODO We cannot save any data from the Geocoding calls
      //   (https://www.mapbox.com/api-documentation/#geocoding)
      // FEATURE.properties.name = //

      var pointFeatures = map.queryRenderedFeatures(e.point, {
        layers: ['points']
      });

      console.clear();
      if (pointFeatures.length) {

        f = feature();
        f.geometry = pointFeatures[0].geometry;
        f.properties = pointFeatures[0].properties;

        geojson.features.map(function(geoFeature, index) {
          var GeoJsonEQ = new GeojsonEquality({
            precision: 1
          });
          compare = GeoJsonEQ.compare(geoFeature.geometry, f.geometry);

          if (compare === true) {
            console.log("geojson equality index = ", index);
            FEATURE_INDEX = index;

            // preserve the feature from the database
            FEATURE.geometry = geojson.features[FEATURE_INDEX].geometry;
            FEATURE.properties = geojson.features[FEATURE_INDEX].properties;
            let t = FEATURE.properties.tags;

            $("input[name='tags']").tagsinput('removeAll');
            $("input[name='tags']").tagsinput('add', t);

            return;
          }
        });

        return;
      }

      // Set a dark color marker
      FEATURE.properties["fill-color"] = "#000000";
      FEATURE.properties.tags = "Set tags and apply color";
      FEATURE.properties.color = rawColorValue(FEATURE.properties["fill-color"]);

      // Update the map with new temporary marker by concatenating, not pushing, new marker to POINTS
      map.getSource('points').setData(featureCollection(POINTS.concat(FEATURE)));

    } else { // County
      queryFeature = map.queryRenderedFeatures(e.point, {
        layers: ['counties']
      });

      FEATURE.properties.FIPS = queryFeature[0].properties.FIPS;
      FEATURE.properties.name = queryFeature[0].properties.COUNTY;

      // add border when county is selected
      filter = baseFilter;
      filter = filter.concat(FEATURE.properties.FIPS);
      map.setFilter("county-border", filter);
    }

    // compare geojson for the current FIPS value, then extract the tags to update the UI
    indexOfFIPS = getFIPSByMap(geojson, FEATURE);
    if (indexOfFIPS != -1) {
      let t = geojson.features[indexOfFIPS].properties.tags;
      $("input[name='tags']").tagsinput('removeAll');
      $("input[name='tags']").tagsinput('add', t);
    }

    $(".county").html(FEATURE.properties.name);

  });

  map.on('mousemove', function(e) {
    // Clean up any other popups
    clearTimeout(setTimeoutConst);
    popup.remove();

    var pointFeatures = map.queryRenderedFeatures(e.point, {
      layers: ['points']
    });

    // prioritize on points over areas
    // If focus is on a point, then show popup, but exit
    if (pointFeatures.length) {
      var pointFeature = pointFeatures[0];
      setTimeoutConst = setTimeout(function() {
        popup.setLngLat(pointFeature.geometry.coordinates)
          .setText(pointFeature.properties.name + " " + pointFeature.properties.tags)
          .addTo(map);
      }, mouseOverDelay);

      return;
    }

    var features = map.queryRenderedFeatures(e.point, {
      layers: ['counties']
    });

    if (features.length) {
      // Single out the first found feature on mouseove.
      var feature = features[0];

      setTimeoutConst = setTimeout(function() {
        popup.setLngLat(e.lngLat)
          .setText(feature.properties.COUNTY)
          .addTo(map);
      }, mouseOverDelay);
    }

    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = features.length ? 'pointer' : '';

  }); // 'mousemove'

}); // 'load'

/////
function setPaintColors(geoJsonObject) {

  byColor = getFIPSByColor(geoJsonObject);

  // Special case when trying to remove the 'last' county
  if (byColor.length === 0) {
    filter = baseFilter;
    filter = filter.concat('[ ]');
    map.setFilter(layer, filter);
    return;
  }

  // Remove layers for each color to ensure UI is updated
  // Then replace each
  paletteColors.forEach(function(color) {
    rawCurrentColor = rawColorValue(color);
    layer = 'counties-highlighted-' + rawCurrentColor;
    map.removeLayer(layer);

    lay = addLayer(color);
    map.addLayer(lay, 'place-city-sm'); // Place polygon under these labels.)
  });

  byColor.forEach(function(colorRow) {
    color = colorRow.color;
    rawCurrentColor = rawColorValue(color);
    layer = 'counties-highlighted-' + rawCurrentColor;

    filter = baseFilter;
    filter = filter.concat(colorRow.FIPS);

    map.setFilter(layer, filter);
  });
}
/////

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
    "FIPS": "",
    "name": ""
  };
}

function updatePOINTS(geoJsonObject) {
  // Update POINTS
  POINTS = geoJsonObject.features.filter(function(f) {
    return f.properties.FIPS === "";
  });

  map.getSource('points').setData(featureCollection(POINTS));
}

function updateGeojson(geoJsonObject, feat) {

  let ff = geoJsonObject.features;

  if (ff.length === 0) {
    ff.push(feat);
    return featureCollection(ff);
  }

  indexOfFIPS = getFIPSByMap(geoJsonObject, feat);
  console.log("index of matching FIPS = " + indexOfFIPS);

  if (indexOfFIPS == -1) { // check if does not exist
    ff.push(feat);
  } else {
    console.log(ff[indexOfFIPS].properties["fill-color"], feat.properties["fill-color"]);
    if (ff[indexOfFIPS].properties["fill-color"] == feat.properties["fill-color"]) {
      // FIPS exists and colors match, remove
      console.log("remove FIPS");
      ff.splice(indexOfFIPS, 1);
    } else {
      // FIPS exists and colors are different, change color
      console.log("Update color and possibly tags");
      ff[indexOfFIPS].properties["fill-color"] = feat.properties["fill-color"];
      ff[indexOfFIPS].properties.color = feat.properties.color;
      ff[indexOfFIPS].properties.tags = feat.properties.tags;
    }
  }

  return featureCollection(ff);

}

function getFIPSByMap(geoJsonObject, feat) {
  let features = geoJsonObject.features;
  let indexOfFIPS = -1;

  indexOfFIPS = features
    .map(function(v) {
      return v.properties.FIPS;
    })
    .indexOf(feat.properties.FIPS);

  return indexOfFIPS;
}

function getFIPSByColor(geoJsonObject) {

  value = [];
  colors = [];

  // first create an array, pushing only unique colors
  for (var f of geoJsonObject.features) {
    fillColor = f.properties['fill-color'];

    // add only unique colors to this array
    if (colors.indexOf(fillColor) == -1) {
      colors.push(fillColor);
    }
  }

  // now iterate overall features, again, to add FIPS
  for (var c of colors) {
    uniqueFips = [];

    for (var ff of geoJsonObject.features) {
      fillColor = ff.properties['fill-color'];
      FIPS = ff.properties.FIPS;

      if (c == fillColor & FIPS !== undefined) {
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
    }
  }
}

////
/// color picker
////
$("#overlay").mouseleave(function() {

});

var swatches = document.getElementById('swatches');

paletteColors.forEach(function(color) {

  var swatch = document.createElement('button');
  swatch.style.backgroundColor = hexToRGBA(color, OPACITY);

  swatch.addEventListener('mouseover', function() {
    console.log(color);
  });

  swatch.addEventListener('click', function() {

    if (FEATURE === null) {
      console.log("No FEATURE chosen, exiting");
      return;
    }

    let t = TAGS;
    FEATURE.properties.tags = t.toString();

    // Create local copy, and pass that by value rather than the global
    p = point([FEATURE.geometry.coordinates[0], FEATURE.geometry.coordinates[1]]);
    f = feature(p);
    f.properties.FIPS = FEATURE.properties.FIPS;
    f.properties["fill-color"] = color;
    f.properties.color = rawColorValue(color);
    f.properties.name = FEATURE.properties.name;
    f.properties.tags = FEATURE.properties.tags;

    if (CHECKBOX === true) { // city is checked
      // Update geojson
      if (FEATURE_INDEX === null) { // null implies not a current marker
        geojson.features.push(f);
      } else {
        // remove if the color is the same
        if (f.properties.color === geojson.features[FEATURE_INDEX].properties.color) {
          geojson.features.splice(FEATURE_INDEX, 1);
        } else {
          geojson.features[FEATURE_INDEX] = f;
        }
      }
      updatePOINTS(geojson);

    } else {
      // add the new clicked feature to the geojson
      geojson = updateGeojson(geojson, f);

      setPaintColors(geojson);
    }

    // update the database
    firebase.database().ref(databaseEndpoint).set({
      geojson: geojson
    });

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
      "fill-outline-color": colorHighlightedCounty,
      "fill-color": hexToRGBA(color, OPACITY)
    },
    "filter": baseFilter
  };

  return layer;
}

function addCountyBorderLayer() {

  var layer = {
    "id": "county-border",
    "type": "line",
    "source": "counties",
    "source-layer": "original",
    "paint": {
      "line-color": "#000000",
      "line-width": 2
    },
    "filter": baseFilter
  };

  return layer;
}

// jQuery

$('input[name="city-county-checkbox"]').on('switchChange.bootstrapSwitch', function(event, state) {
  CHECKBOX = state;

  // Turn off county border highlighted
  map.setFilter("county-border", baseFilter);

  // Set markers to only those that are from the geojson database
  updatePOINTS(geojson);

});

$(function() {

  $("[name='city-county-checkbox']").bootstrapSwitch();

  $('input').on('change', function(event) {

    var $element = $(event.target);
    var $container = $element.closest('.example');

    if (!$element.data('tagsinput'))
      return;

    var val = $element.val();
    if (val === null)
      val = "null";

    TAGS = $element.tagsinput('items');

    if (FEATURE) {
      FEATURE.properties.tags = TAGS.toString();

      if (FEATURE_INDEX !== null) {
        geojson.features[FEATURE_INDEX] = FEATURE;

        updatePOINTS(geojson);

        // update the database
        firebase.database().ref(databaseEndpoint).set({
          geojson: geojson
        });

      }
    }

  }).trigger('change');
});
