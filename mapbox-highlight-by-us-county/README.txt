A Pen created at CodePen.io. You can find this one at http://codepen.io/roblabs/pen/woMyJy.

 # Pseudo-code
* Grab GeoJson from database
* Sort for unique colors, keeping track of FIPS number which is used to identify a county
* For every unique color, paint the county that has a FIPS number

# When click happens
* check if county already has an entry in the GeoJson data
* If it exists, remove it
* If it doesn't exist, then add it

https://www.mapbox.com/mapbox-gl-js/example/color-switcher/
https://www.mapbox.com/mapbox-gl-js/example/query-similar-features/
https://www.mapbox.com/mapbox-gl-js/example/using-box-queryrenderedfeatures/
http://nws.noaa.gov/mirs/public/prods/maps/cnty_fips_def.htm