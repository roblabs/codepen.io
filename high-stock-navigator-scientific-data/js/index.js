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
      console.log(data[i]);
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