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




function filterData(json){
  var json_data = filterBySelectedDate(json);
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
  function filterBySelectedDate(data){
    //get Dates
    let url = window.location.href;
    url = url.split("?",2);
    if(url.length === 1){
      __DATESET_LIMITED_BY_DATE__ = false;
      return data; // No parameters given. Therefore no Date limiters
    }else{
      __DATESET_LIMITED_BY_DATE__ = true;
      let parameters = url[1];
      parameters = parameters.substring(parameters.lastIndexOf("[DATE]")+6,parameters.lastIndexOf("[/DATE]"));
      let dates = parameters.split(";",2);
      if(dates.length !== 2){
        __DATESET_LIMITED_BY_DATE__ = false;
        console.error("URL is set up incorrect. Ignoring filtering by date.");
        return data;
      }
      $("#check_limit_selection > input").prop("checked",true);
      $("#daterange").removeClass("hidden");
      let daterange_txt = (moment(dates[0]).format("YYYY-MM-DD"))+" - "+((moment(dates[1]).format("YYYY-MM-DD")));
      $("#daterange").val(daterange_txt);
      if(moment(dates[0]).unix()>moment(dates[1])){
        dates = dates.reverse();
        console.warn("First date was greater than last date. Reversing order.");
      }


      //Get lower limit
      return data.splice(getLowerLimit(moment(dates[0]).unix()),getUpperLimit(moment(dates[1]).unix()));

    }
    function getLowerLimit(date){
      let index = 0;
      for(let i = 0;i<data.length;i++){
        if(moment(data[i].dateVisited).unix()>date){
          return i-1;
        }
      }
      console.warn("Date out of range. Ignoring lower limit");
      return 0;
    }
    function getUpperLimit(date){
      for(let i = data.length-1;i>=0;i--){
        if(moment(data[i].dateVisited).unix()>date){
          return i;
        }
      }
      console.warn("Date out of range. Ignoring upper limit");
      return data.length-1;
    }
  }
}
