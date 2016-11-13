A Pen created at CodePen.io. You can find this one at http://codepen.io/roblabs/pen/woMyJy.

 # Customer/User Interface
* Choose the mode for either City or County
* Choose a feature, a City or County
* Set your tags
* Set your color, pressing the color writes to the Firebase and can be thought of the same as pressing `ok` or `apply`.

# Pseudo-code
* Grab GeoJson from database
* Sort for unique colors, keeping track of FIPS number which is used to identify a county
* For every unique color, paint the county that has a FIPS number

# Click on an empty county
* Set the tags you want save
* When pressing on the color, the Firebase is updated with the tags and color for that county

# Click on an existing county
* from the GeoJson database already in memory, grab the Tags, County name and populate the overlay UI
* If the customer clicks on the current color for a county, it will remove it from Firebase


# References
* https://www.mapbox.com/mapbox-gl-js/example/color-switcher/
* https://www.mapbox.com/mapbox-gl-js/example/query-similar-features/
* https://www.mapbox.com/mapbox-gl-js/example/using-box-queryrenderedfeatures/
* http://nws.noaa.gov/mirs/public/prods/maps/cnty_fips_def.htm
* http://www.bootstrap-switch.org/

# Javascript Libraries
* Mapbox GL JS
* Bootstrap
* Bootstrap TagsInput
* Bootstrap Switch
* JQuery
* JQuery UI