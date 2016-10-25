// Mapbox
var map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/mapbox/streets-v9', //stylesheet location
  center: [0, 0], // starting position
  zoom: 0 // starting zoom
});


/// Plot.ly

var rawDataURL = 'http://www.RobLabs.com/8-day.csv';
var xField = 'date';
var yField = 'threshold_none';

var selectorOptions = {
    buttons: [
        {
          step: 'year',
          stepmode: 'backward',
          count: 10,
          label: '10y'
        },
        {
          step: 'year',
          stepmode: 'backward',
          count: 2,
          label: '2y'
        },
        {
          step: 'year',
          stepmode: 'backward',
          count: 1,
          label: '1y'
      },
      {
        step: 'all',
    }],
};



Plotly.d3.csv(rawDataURL, function(err, rawData) {
    if(err) throw err;

    var myPlot = document.getElementById('plotly'),
        d3 = Plotly.d3,
        N = 16,
        x = d3.range(N),
        y = d3.range(N).map( d3.random.normal() ),
        data = [ { x:x, y:y, type:'scatter',
                mode:'markers', marker:{size:16} } ],
        layout = {
            hovermode:'closest',
            title:'Click on Points'
         };


    var data = prepData(rawData);
    var layout = {
        title: '8 Day Chlorophyll Concentration (mg/m^3)',
        // height: 400,
        xaxis: {
            rangeselector: selectorOptions,
            rangeslider: {},
            titlefont: {size : 8},
        },
        yaxis: {
            fixedrange: false
        }
    };

    Plotly.newPlot('plotly', data, layout);

    myPlot.on('plotly_click', function(data){
    var pts = '';
    for(var i=0; i < data.points.length; i++){

      var plotLyDate = data.points[i].x;
      console.log(plotLyDate + " " + data.points[i].y);
      var dateClicked = new Date(plotLyDate);

      var y = dateClicked.toLocaleString("en-us", { year: "numeric" });
      var m = dateClicked.toLocaleString("en-us", { month: "2-digit" });

      var layer = "MY1DMM_CHLORA_" + y + "-" + m;

      pts = plotLyDate + ", Updating Map to " + layer;
    }

    console.log(pts);
    var indexClicked = tilesNASAGeoTiffsLayerIds.indexOf(layer);
    console.log(indexClicked);

    switchLayer(indexClicked);

  });
});

function prepData(rawData) {
    var x = [];
    var y = [];

    console.log(rawData.length)

    rawData.forEach(function(datum, i) {

        var date = new Date(datum[xField]);
        // console.log(datum[xField]);
        x.push(datum[xField]);
        y.push(datum[yField]);

    });

    return [{
        mode: 'lines',
        x: x,
        y: y
    }];
}