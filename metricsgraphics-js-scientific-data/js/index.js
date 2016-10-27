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
var timerId = 0;  \n  \
var z = MG.data_graphic({\n  \
  onclick: function(d, i){\n  \
      console.log(i + \" click\");\n  \
  },\n  \
  mouseover: function(d, i) {\n  \
    timerId = setTimeout(function() {\n  \
        console.log(i + \" 2 seconds have elapsed\");\n  \
    }, 750);\n  \
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
";



var minify = "function fake_days(a){for(var b=[],c=0;c<a.length;c++){var d=a[c].date,e=new Date(d);v=a[c].threshold_none,b.push({date:MG.clone(e),value:v})}return b}var input=JSON.parse(document.querySelector(\".data textarea\").value),many_many_many_days=fake_days(input),timerId=0,z=MG.data_graphic({onclick:function(a,b){console.log(b+\" click\")},mouseover:function(a,b){timerId=setTimeout(function(){console.log(b+\" 2 seconds have elapsed\")},750)},mouseout:function(a,b){clearTimeout(timerId)},title:\"Chlorophyll Concentration\",description:\"Description\",data:many_many_many_days,markers:[{date:2008,label:'\"Thor\" released'}],width:400,height:250,target:\".result\"});";

var default_call = '//modify away!\n'
            + 'MG.data_graphic({\n'
            + '  title: "UFO Sightings",\n'
            + '  description: "Yearly UFO sightings from 1945 to 2010.",\n'
            + '  data: JSON.parse(document.querySelector(\'.data textarea\').value),\n'
            + '  markers: [{\'year\': 1964, \'label\': \'"The Creeping Terror" released\'}],\n'
            + '  width: 400,\n'
            + '  height: 250,\n'
            + '  target: ".result",\n'
            + '  x_accessor: "year",\n'
            + '  y_accessor: "sightings",\n'
            + '});';

        var editor = ace.edit("editor");
        editor.getSession().setMode("ace/mode/javascript");
        editor.setValue(multiline);
        editor.gotoLine(1);
        editor.setHighlightActiveLine(false);

        d3.json('https://gist.githubusercontent.com/roblabs/436e5460a640170fc77033d362fb0bd0/raw/d45c86c83679ce923ee52905b70fee202a21e577/8-day.json', function(data) {
            document.querySelector('.data textarea').value = JSON.stringify(data, null, 2);
            eval(editor.getValue());
        })

        d3.select('.update').on('click', function() {
            eval(editor.getValue());
        })