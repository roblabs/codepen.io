A Pen created at CodePen.io. You can find this one at http://codepen.io/roblabs/pen/woMyJy.

 # Customer Interface
## Set City or County mode using switch
### Click on a City
  * Sets a dark color marker
  * Add new > Add tags, 'apply' settings by pressing a color
  * Update existing > change colors, change tags, or remove altogether by 'apply' same color
* Hover on a City
  * Show popup with tags, name (via geocode)

### Click on a County
  * Highlights county border with a dark border
  * Add new > Add tags, 'apply' settings by pressing a color
  * Update existing > change colors, change tags, or remove altogether by 'apply' same color
* Hover on a City
  * Show popup with tags, name


# Pseudo-code
* Grab GeoJson from database
* Sort for unique colors, keeping track of FIPS number which is used to identify a county
* For every unique color, paint the county that has a FIPS number


# References
* https://www.mapbox.com/mapbox-gl-js/example/color-switcher/
* https://www.mapbox.com/mapbox-gl-js/example/query-similar-features/
* https://www.mapbox.com/mapbox-gl-js/example/using-box-queryrenderedfeatures/
* http://nws.noaa.gov/mirs/public/prods/maps/cnty_fips_def.htm
* http://bootstrap-tagsinput.github.io/bootstrap-tagsinput/examples/
* http://www.bootstrap-switch.org/
* http://jslint.com/

# Javascript Libraries
*[ Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js/api/) - Mapbox GL JS license
* [Bootstrap[(http://getbootstrap.com/) - MIT License
* [Bootstrap TagsInput](https://github.com/bootstrap-tagsinput/bootstrap-tagsinput) - MIT License
* [Bootstrap Switch](http://www.bootstrap-switch.org/) - Apache 2.0 License
* [JQuery](https://jquery.com/) - jQuery License
* [JQuery UI](https://jqueryui.com/) - jQuery License
* [geojson-equality](https://github.com/geosquare/geojson-equality) - MIT License

# Known issues
* Mapbox Terms of Service for free account does not allow a customer to retain the results of a Geocode
* A city is defined as not having a name in the data base
* Moving from County mode to City mode leaves border-highlighted