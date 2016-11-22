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

// geojson-equality
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var t;"undefined"!=typeof window?t=window:"undefined"!=typeof global?t=global:"undefined"!=typeof self&&(t=self),t.GeojsonEquality=e()}}(function(){return function e(t,r,o){function n(c,u){if(!r[c]){if(!t[c]){var p="function"==typeof require&&require;if(!u&&p)return p(c,!0);if(i)return i(c,!0);var s=new Error("Cannot find module '"+c+"'");throw s.code="MODULE_NOT_FOUND",s}var a=r[c]={exports:{}};t[c][0].call(a.exports,function(e){var r=t[c][1][e];return n(r?r:e)},a,a.exports,e,t,r,o)}return r[c].exports}for(var i="function"==typeof require&&require,c=0;c<o.length;c++)n(o[c]);return n}({1:[function(e,t){function r(e){return e.coordinates.map(function(t){return{type:e.type.replace("Multi",""),coordinates:t}})}function o(e,t){return e.hasOwnProperty("coordinates")?e.coordinates.length===t.coordinates.length:e.length===t.length}function n(e,t){return i(e,t,{strict:!0})}var i=e("deep-equal"),c=function(e){this.precision=e&&e.precision?e.precision:17,this.direction=e&&e.direction?e.direction:!1,this.pseudoNode=e&&e.pseudoNode?e.pseudoNode:!1,this.objectComparator=e&&e.objectComparator?e.objectComparator:n};c.prototype.compare=function(e,t){if(e.type!==t.type||!o(e,t))return!1;switch(e.type){case"Point":return this.compareCoord(e.coordinates,t.coordinates);case"LineString":return this.compareLine(e.coordinates,t.coordinates,0,!1);case"Polygon":return this.comparePolygon(e,t);case"Feature":return this.compareFeature(e,t);default:if(0===e.type.indexOf("Multi")){var n=this,i=r(e),c=r(t);return i.every(function(e){return this.some(function(t){return n.compare(e,t)})},c)}}return!1},c.prototype.compareCoord=function(e,t){if(e.length!==t.length)return!1;for(var r=0;r<e.length;r++)if(e[r].toFixed(this.precision)!==t[r].toFixed(this.precision))return!1;return!0},c.prototype.compareLine=function(e,t,r,n){if(!o(e,t))return!1;var i=this.pseudoNode?e:this.removePseudo(e),c=this.pseudoNode?t:this.removePseudo(t);if(!n||this.compareCoord(i[0],c[0])||(c=this.fixStartIndex(c,i))){var u=this.compareCoord(i[r],c[r]);return this.direction||u?this.comparePath(i,c):this.compareCoord(i[r],c[c.length-(1+r)])?this.comparePath(i.slice().reverse(),c):!1}},c.prototype.fixStartIndex=function(e,t){for(var r,o=-1,n=0;n<e.length;n++)if(this.compareCoord(e[n],t[0])){o=n;break}return o>=0&&(r=[].concat(e.slice(o,e.length),e.slice(1,o+1))),r},c.prototype.comparePath=function(e,t){var r=this;return e.every(function(e,t){return r.compareCoord(e,this[t])},t)},c.prototype.comparePolygon=function(e,t){if(this.compareLine(e.coordinates[0],t.coordinates[0],1,!0)){var r=e.coordinates.slice(1,e.coordinates.length),o=t.coordinates.slice(1,t.coordinates.length),n=this;return r.every(function(e){return this.some(function(t){return n.compareLine(e,t,1,!0)})},o)}return!1},c.prototype.compareFeature=function(e,t){return e.id===t.id&&this.objectComparator(e.properties,t.properties)&&this.compareBBox(e,t)?this.compare(e.geometry,t.geometry):!1},c.prototype.compareBBox=function(e,t){return!e.bbox&&!t.bbox||e.bbox&&t.bbox&&this.compareCoord(e.bbox,t.bbox)?!0:!1},c.prototype.removePseudo=function(e){return e},t.exports=c},{"deep-equal":2}],2:[function(e,t){function r(e){return null===e||void 0===e}function o(e){return e&&"object"==typeof e&&"number"==typeof e.length?"function"!=typeof e.copy||"function"!=typeof e.slice?!1:e.length>0&&"number"!=typeof e[0]?!1:!0:!1}function n(e,t,n){var s,a;if(r(e)||r(t))return!1;if(e.prototype!==t.prototype)return!1;if(u(e))return u(t)?(e=i.call(e),t=i.call(t),p(e,t,n)):!1;if(o(e)){if(!o(t))return!1;if(e.length!==t.length)return!1;for(s=0;s<e.length;s++)if(e[s]!==t[s])return!1;return!0}try{var f=c(e),l=c(t)}catch(d){return!1}if(f.length!=l.length)return!1;for(f.sort(),l.sort(),s=f.length-1;s>=0;s--)if(f[s]!=l[s])return!1;for(s=f.length-1;s>=0;s--)if(a=f[s],!p(e[a],t[a],n))return!1;return typeof e==typeof t}var i=Array.prototype.slice,c=e("./lib/keys.js"),u=e("./lib/is_arguments.js"),p=t.exports=function(e,t,r){return r||(r={}),e===t?!0:e instanceof Date&&t instanceof Date?e.getTime()===t.getTime():"object"!=typeof e&&"object"!=typeof t?r.strict?e===t:e==t:n(e,t,r)}},{"./lib/is_arguments.js":3,"./lib/keys.js":4}],3:[function(e,t,r){function o(e){return"[object Arguments]"==Object.prototype.toString.call(e)}function n(e){return e&&"object"==typeof e&&"number"==typeof e.length&&Object.prototype.hasOwnProperty.call(e,"callee")&&!Object.prototype.propertyIsEnumerable.call(e,"callee")||!1}var i="[object Arguments]"==function(){return Object.prototype.toString.call(arguments)}();r=t.exports=i?o:n,r.supported=o,r.unsupported=n},{}],4:[function(e,t,r){function o(e){var t=[];for(var r in e)t.push(r);return t}r=t.exports="function"==typeof Object.keys?Object.keys:o,r.shim=o},{}]},{},[1])(1)});
