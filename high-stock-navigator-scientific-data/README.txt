A Pen created at CodePen.io. You can find this one at http://codepen.io/roblabs/pen/bwzzEx.

 1.  Loads AAPL data, sets Navigator to a fixed time window

2.  Chart is Navigator only chart
    * [http://jsfiddle.net/f7Y9p/](http://jsfiddle.net/f7Y9p/)
    * [http://forum.highcharts.com/highcharts-usage/navigator-only-chart-t21265/](http://forum.highcharts.com/highcharts-usage/navigator-only-chart-t21265/)
    
3.  If user changes extremes (either the min or max), reset the window to the default fixed time window
    * [http://jsfiddle.net/PyMag/1/](http://jsfiddle.net/PyMag/1/)
    * [http://stackoverflow.com/questions/16612061/highstock-make-navigator-handles-move-a-fixed-distance-relative-to-eachother](http://stackoverflow.com/questions/16612061/highstock-make-navigator-handles-move-a-fixed-distance-relative-to-eachother)
    [http://api.highcharts.com/highstock/xAxis.events.afterSetExtremes](http://api.highcharts.com/highstock/xAxis.events.afterSetExtremes)