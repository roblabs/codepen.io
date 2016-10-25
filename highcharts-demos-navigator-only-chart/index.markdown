<div id="container" style="height: 100px; min-width: 500px"></div>

### High Stock Navigator-only Chart

1.  Loads AAPL data, sets Navigator to a fixed time window

2.  Chart is Navigator only chart
    * [http://jsfiddle.net/f7Y9p/](http://jsfiddle.net/f7Y9p/)
    * [http://forum.highcharts.com/highcharts-usage/navigator-only-chart-t21265/](http://forum.highcharts.com/highcharts-usage/navigator-only-chart-t21265/)
    
3.  If user changes extremes (either the min or max), reset the window to the default fixed time window
    * [http://jsfiddle.net/PyMag/1/](http://jsfiddle.net/PyMag/1/)
    * [http://stackoverflow.com/questions/16612061/highstock-make-navigator-handles-move-a-fixed-distance-relative-to-eachother](http://stackoverflow.com/questions/16612061/highstock-make-navigator-handles-move-a-fixed-distance-relative-to-eachother)
    [http://api.highcharts.com/highstock/xAxis.events.afterSetExtremes](http://api.highcharts.com/highstock/xAxis.events.afterSetExtremes)
    
### Current issues
```
1.  When 'grabbing' and moving either the min or max extreme, it may take 1-2 times to move the window properly.
2.  Checking `console.log` it looks like the event handler is called too many times.
```

### Usage cases
```
1.  Click on area of graph, either in the window or out
2.  grab 'bottom' of window, and move left & right
3.  grab 'right' extreme of window, and make window larger.   Should snap to default window width
4.  grab 'right' extreme of window, and make window smaller.  Should snap to default window width
5.  grab 'left'  extreme of window, and make window larger.   Should snap to default window width
6.  grab 'left'  extreme of window, and make window smaller.  Should snap to default window width
```

<script src='https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min.js'></script>
<script src="http://code.highcharts.com/stock/highstock.js"></script>
<script src="http://code.highcharts.com/stock/modules/exporting.js"></script>
