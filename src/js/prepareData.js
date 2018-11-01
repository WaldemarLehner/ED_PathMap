/*
This script takes the input-data and filters out any unnecessary data.
In addition to that it sets up a map of Systems which hold the coordinates of said system
Requires jQuery
*/

//eventListeners
$(document).ready(function(){
  //load shaders
  __SHADERS = {LOD0:{}};
  $.ajax({
    url:"/src/shader/pointsLOD0_fragment.glsl",
    context: document.body,
    dataType: "text"
  }).done(function(data){
    __SHADERS.LOD0.fragment = data;
  });
  $.ajax({
    url:"/src/shader/pointsLOD0_vertex.glsl",
    context: document.body,
    dataType: "text"
  }).done(function(data){
    __SHADERS.LOD0.vertex = data;
  });
  $("#fileinput_init").on("click",importFile);

});


function importFile(){

  let file_input = document.getElementById("fileinput").files[0];
  if(file_input === undefined || file_input === null){
    throw "no file has been selected";

  }
  if(file_input.type != "application/json"){
    throw "file not type of 'application/json'";

  }

  let filereader = new FileReader();
  $("#fileinput_label").remove();
  $("#fileinput").remove();
  $("#fileinput_init").remove();
  $("#settings").hide();
  filereader.onload = function(event_logs){
      filterData(JSON.parse(event_logs.srcElement.result));

  };
  filereader.readAsText(file_input);
}

function filterData(json_data){

  //SysLog is the travel log described in the get-logs.json
  var syslog = [];
  //SysList is an object of all needed systems with x y z and the amount of travels through said system
  var syslist = [];
  //SysConnections is an object of all connections between two systems
  var sysconnections = [];
  //Count max visits per system/connection
  var sysMaxCount = 0;
  var conMaxCount = 0;

  //Generate a syslist object
  json_data.forEach(function(entry){
    var system = {
        x:entry.x/32,
        y:entry.y/32,
        z:entry.z/32,
        name: entry.name
      };
    system.count = 0;
    syslist[entry.name] = system;
  });

  //Filter out unnecessary data from log and get system count data
  json_data.forEach(function(entry){
    syslog.push({name:entry.name,date:entry.dateVisited});
    if(typeof syslist[entry.name] !== "undefined"){
      syslist[entry.name].count++;
      if(syslist[entry.name].count > sysMaxCount){
        sysMaxCount = syslist[entry.name].count;
      }
    }
  });

  //Generate a list of all connections
  for(let i = 0; i < syslog.length-1;i++){
    let system1 = syslog[i].name;
    let system2 = syslog[i+1].name;
    var name;
    var object = {};
    if(system1 < system2){
      name = system1+":"+system2;
    }
    else{
      name = system2+":"+system1;
    }
    //Connection has not been defined yet. time to define it;
    if(typeof sysconnections[name] === "undefined"){
      if(system1 < system2){
        //The comparatively "smaller" string is sys1
        object.sys1 = system1;
        object.sys2 = system2;
        object.tosys2count = 1;
        object.tosys1count = 0;
      }
      else{
        object.sys1 = system2;
        object.sys2 = system1;
        object.tosys2count = 0;
        object.tosys1count = 1;
      }
      //Add connection to list
      sysconnections[name] = object;
    }
    else{
      if(system1 < system2){
        sysconnections[name].tosys2count++;
      }
      else{
        sysconnections[name].tosys1count++;
      }

      if(sysconnections[name].tosys1count+sysconnections[name].tosys2count > conMaxCount){
        conMaxCount = sysconnections[name].tosys1count+sysconnections[name].tosys2count;
      }
    }

  }

//Send prepared data over to drawData.js for map generation.
  drawData(syslog,syslist,sysconnections,sysMaxCount,conMaxCount);
}
