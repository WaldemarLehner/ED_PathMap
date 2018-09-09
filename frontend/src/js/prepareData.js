/*
This script takes the input-data and filters out any unnecessary data.
In addition to that it sets up a map of Systems which hold the coordinates of said system
Requires jQuery
*/

//eventListeners
$(document).ready(function(){
  $("#fileinput").on("click",importFile);

});


function importFile(){

  let file_log = document.getElementById("fileinput_travellog").files[0];
  let file_syslist = document.getElementById("fileinput_sysmap").files[0];
  if(file_log === undefined || file_log === null){
    UI.createError("No file has been selected.",1000);
    return undefined; //cancel operation
  }
  if(file_log.type != "application/json"){
    UI.createError("Selected file is not in JSON format.",1000);
    return undefined;
  }

  if(file_syslist === undefined || file_syslist === null){
    UI.createError("No file has been selected.",1000);
    return undefined; //cancel operation
  }
  if(file_syslist.type != "application/json"){
    UI.createError("Selected file is not in JSON format.",1000);
    return undefined;
  }

  let filereader_logs = new FileReader();
  let filereader_syslist = new FileReader();
  filereader_logs.onload = function(event_logs){

    filereader_syslist.onload = function(event_syslist){

      filterData(JSON.parse(event_logs.srcElement.result).logs.reverse(),JSON.parse(event_syslist.srcElement.result));
    };
    filereader_syslist.readAsText(file_syslist);

  };
  filereader_logs.readAsText(file_log);



}

function filterData(json_data,json_syslist){
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
  json_syslist.forEach(function(entry){
    var system = {
        x:entry.Coords.X,
        y:entry.Coords.Y,
        z:entry.Coords.Z,
        name: entry.Name
      };
    system.count = 0;
    syslist[entry.Name] = system;
  });

  //Filter out unnecessary data from log and get system count data
  json_data.forEach(function(entry){
    syslog.push({name:entry.system,date:entry.date});
    if(typeof syslist[entry.system] !== "undefined"){
      syslist[entry.system].count++;
      if(syslist[entry.system].count > sysMaxCount){
        sysMaxCount = syslist[entry.system].count;
      }
    }
  });
  //console.log(syslist);

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
