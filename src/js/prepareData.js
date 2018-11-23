/*
This script takes the input-data and filters out any unnecessary data.
In addition to that it sets up a map of Systems which hold the coordinates of said system
Requires jQuery
*/

//Get Travel Log

$.ajax({
  url:(typeof __DATASOURCE__.api.logs === "undefined") ? __DATASOURCE__.default+"src/data/logs.json" : __DATASOURCE__.api.logs,
  success: function(data){
    $(document).ready(function(){
      UI.Loader.updateText1();
      UI.Loader.updateText2("Processing travel history");
      filterData(data);
    });
  },
  error: function(){
    throw "[AJAX] Failed to get Travel History. Please submit an issue on github.";
  }
});




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
  UI.Loader.updateText1();
  UI.Loader.updateText2("Draw travel history");
  drawData(syslog,syslist,sysconnections,sysMaxCount,conMaxCount);
}
