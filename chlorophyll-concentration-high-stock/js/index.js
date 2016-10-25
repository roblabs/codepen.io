// Mapbox
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-v9',
  center: [0, 0],
  zoom: 3
});

///////////
// Mapbox layer switching

// Use these to keep track of which Source and Layer to delete
var previousSource = "";
var previousLayer = "";
var layerId = "";

// convenience for source and for layer names
// TODO - change to your Mapbox account name
var rootSourceUrlLayerId = {
  "rootSourceUrl": "mapbox://mriedijk.",
  "rootLayerId": "uniqueId-"
};

// Populate this list from those on Mapbox.com

//TODO this should be generated by the list currently at Mapbox.com/studio

// pad a leading zero on the month, as that's how the month code data came from NASA.
function pad(d) {
  return (d < 10) ? '0' + d.toString() : d.toString();
}

var root = "MY1DMM_CHLORA";
// TODO Javascript range??
var months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
var years = [2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016];

var month;
var year;

var tilesNASAGeoTiffsLayerIds = [];

for (year = 0; year < years.length; year++) {
  for (month = 0; month < months.length; month++) {

    // special case for 2002 & 16
    if (years[year] == 2016 && months[month] > 7) {
      // do nothing
    } else if (years[year] == 2002 && months[month] < 8) {
      // do nothing
    } else {
      lyr = root + "_" + years[year] + "-" + pad(months[month]);
      tilesNASAGeoTiffsLayerIds.push(lyr);
    }
  }
}

console.log(tilesNASAGeoTiffsLayerIds.length);

/**
 * load -
 * Fired immediately after all necessary resources have been downloaded
 * and the first visually complete rendering of the map has occurred.
 */
map.on('load', function() {
  switchLayer(0);
});

function switchLayer(layer) {
  layerId = tilesNASAGeoTiffsLayerIds[layer];
  document.getElementById("dataSet").innerHTML = layerId;
  /*
    Update sources and layers
  */

  try {
    currentSource = rootSourceUrlLayerId.rootSourceUrl + layerId;
    map.addSource(currentSource, {
      "url": currentSource,
      "type": "raster"
    });
  } catch (err) {
    console.log(err.message);
  }

  currentLayer = rootSourceUrlLayerId.rootLayerId + layerId;
  map.addLayer({
    "id": currentLayer,
    "type": "raster",
    "source": currentSource,
    "interactive": true,
    "layout": {
      "visibility": "visible"
    }
  });

  /*
    Clean up older layers
  */

  // Remove older layer
  try {
    map.removeLayer(previousLayer);
  } catch (err) {
    console.log(err.message);
  } finally {
    previousLayer = currentLayer;
  }

}

function outputUpdate(sliderIndex) {
  document.querySelector('#dataSet').value = tilesNASAGeoTiffsLayerIds[sliderIndex];
  console.log(tilesNASAGeoTiffsLayerIds[sliderIndex]);
  switchLayer(sliderIndex);
}

///////////

// High Stock

var maxRange = 30 * 24 * 3600 * 1000;

var MAX, MIN = 0;

console.clear();

function updateExtremes(xAxis, min, max) {
  timeout = setTimeout(function() {
    xAxis.setExtremes(min, max);
    setMinMax(xAxis);

  }, 1);

  return timeout;
}

function setMinMax(xAxis) {
  var extremes = xAxis.getExtremes();
  MAX = extremes.max;
  MIN = extremes.min;

  return extremes;
}

$(function() {

  $.getJSON('https://gist.githubusercontent.com/roblabs/436e5460a640170fc77033d362fb0bd0/raw/d45c86c83679ce923ee52905b70fee202a21e577/8-day.json', function(incomingData) {

    var data = [];
    for (var i = 0; i < incomingData.length; i++) {

      var d = new Date(incomingData[i].date);
      data.push([d.getTime(), incomingData[i].threshold_none]);
    }
    // Create the chart
    window.chart = new Highcharts.StockChart({

      credits: {
        enabled: true,
        text: "http://RobLabs.com",
        href: "http://RobLabs.com"
      },

      chart: {
        renderTo: 'container',

        events: {
          load: function() {
            console.log("events.load");
            var chart = this;

            // get the extremes of the data set
            // Set the window based on the maximum of the dataset
            var extremes = setMinMax(chart.xAxis[0]);
            chart.xAxis[0].setExtremes(extremes.max - maxRange, extremes.max);

            // set MAX and MIN based on where the window was set
            setMinMax(chart.xAxis[0]);
          }
        }
      },
      xAxis: {
        lineWidth: 0,
        tickLength: 0,
        labels: {
          enabled: false
        },
        events: {
          afterSetExtremes: function(e) {
            console.log("events.afterSetExtremes");

            // filter undefined events
            if (e.trigger === undefined) {
              return;
            }

            var x = this; //chart xAxis

            var plotLyDate = this.series[0].processedXData[0];
            var dateClicked = new Date(plotLyDate);

            var y = dateClicked.toLocaleString("en-us", {
              year: "numeric"
            });
            var m = dateClicked.toLocaleString("en-us", {
              month: "2-digit"
            });

            var layer = "MY1DMM_CHLORA_" + y + "-" + m;

            var indexClicked = tilesNASAGeoTiffsLayerIds.indexOf(layer);
            console.log(indexClicked);

            switchLayer(indexClicked);

            pts = "Updating Map to " + layer;
            console.log(pts);

            // check if the user set the extermes
            // too much.  If so, adjust
            var extremes = x.getExtremes();

            var max = extremes.max;
            var min = extremes.min;

            // round Window size to nearest month
            var windowSize = Math.floor((extremes.max - extremes.min) / maxRange);

            if (windowSize < 1.0) { // window made smaller
              if (max < MAX) {
                console.log("Window smaller - max was moved left");
                min = max - maxRange;
                MAX = max;
              } else if (min > MIN) {
                console.log("Window smaller - min was moved right");
                max = min + maxRange;
                MIN = min;
              }

              updateExtremes(x, min, max);

            } else if (windowSize > 1.0) { // window made larger
              if (max > MAX) {
                console.log("Window larger - max was moved right");
                min = max - maxRange;
                MAX = max;
              } else if (min < MIN) {
                console.log("Window larger - min was moved left");
                max = min + maxRange;
                MIN = min;
              }

              updateExtremes(x, min, max);

            }
          }
        }
      },
      yAxis: {
        height: 0,
        gridLineWidth: 0,
        labels: {
          enabled: false
        }
      },
      navigator: {},
      rangeSelector: {
        enabled: false
      },
      tooltip: {
        enabled: false
      },
      title: {
        text: 'Chlorophyll Concentration'
      },
      subtitle: {
        text: 'Click on date to move current window'
      },
      series: [{
        name: 'AAPL',
        lineWidth: 0,
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: false
            }
          }
        },
        data: data
      }]
    });
  });

});