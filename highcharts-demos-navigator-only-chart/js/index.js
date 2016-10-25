var maxRange = 200 * 24 * 3600 * 1000; // 200 day window is appropriate for AAPL stock data demo

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

  $.getJSON('http://www.highcharts.com/samples/data/jsonp.php?filename=aapl-c.json&callback=?', function(data) {
    

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
        text: 'AAPL Stock Price'
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