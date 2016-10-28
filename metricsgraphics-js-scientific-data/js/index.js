console.clear();


var multiline = "\
function fake_days(input) {\n  \
\
    var data = [];\n  \
    for (var i = 0; i < input.length; i++) {\n  \
        var d = input[i].date;\n  \
        var y = new Date(d);\n  \
        v = input[i].threshold_none;\n  \
\
        data.push({date: MG.clone(y), value: v});\n  \
    } \
    return data;\n  \
}\n  \
\
var input = JSON.parse(document.querySelector(\".data textarea\").value);\n  \
var many_many_many_days = fake_days(input);\n  \
var mouseOverIndex = 0;\n  \
var timerId = 0;  \n  \
var z = MG.data_graphic({\n  \
  click: function(d, i){\n  \
      console.log(i + \" was clicked\");\n  \
  },\n  \
  mouseover: function(d, i) {\n  \
    timerId = setTimeout(function() {\n  \
        mouseOverIndex = i;\n  \
        console.log(\"mouseover on index = \" + i);\n  \
    }, 50);\n  \
  },\n  \
  mouseout: function(d, i) {\n  \
    clearTimeout(timerId);\n  \
  },\n  \
  title: \"Chlorophyll Concentration\",\n  \
  description: \"Description\",\n  \
  data: many_many_many_days,\n  \
  markers: [{\'date\': 2008, \'label\': \'\"Thor\" released\'}],\n  \
  width: 400,\n  \
  height: 250,\n  \
  target: \".result\",\n  \
});\n  \
\n  \
 d3.select('.result').on('click', \n  \
 function() {\n  \
              console.log(\"clicked on index \" + mouseOverIndex);\n  \
              var data = JSON.parse(document.querySelector(\".data textarea\").value);\n  \
              var month = d3.select(\"#month\");\n  \
              month.html(data[mouseOverIndex].date);\n  \
        });\n  \
";


var editor = ace.edit("editor");
editor.getSession().setMode("ace/mode/javascript");
editor.setValue(multiline);
editor.gotoLine(1);
editor.setHighlightActiveLine(false);


d3.json('https://gist.githubusercontent.com/roblabs/436e5460a640170fc77033d362fb0bd0/raw/d45c86c83679ce923ee52905b70fee202a21e577/8-day.json', function(data) {

            document.querySelector('.data textarea').value = JSON.stringify(data, null, 2);
            eval(editor.getValue());
        });

// Create a click handler for the "run" button
d3.select('.update').on('click', function() {
            eval(editor.getValue());
        })