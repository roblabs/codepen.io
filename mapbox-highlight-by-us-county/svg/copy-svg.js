var paletteColors = [
  '#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494',
  '#fed976', '#feb24c', '#fd8d3c', '#f03b20', '#bd0026'
];

function rawColorValue(color) {
  // color looks like #123456
  //   strip off the '#'
  return color.split('#')[1];
}

paletteColors.forEach(function(color){
  console.log("cp marker-abc-15.svg marker-" + rawColorValue(color) + "-15.svg");
});
