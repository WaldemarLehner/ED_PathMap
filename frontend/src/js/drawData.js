/*
This script uses the data prepares by prepareData.js to generate the 3D map.
*/

//                  \/ - An array containing all systems ordered by date (first = earliest)
//                            \/ - An object containing all systems with coordinates and visit count
//                                        \/ - An object containing all connections between two systems, both system names and travel count for both ways.
function drawData(logList, systemList, connectionList, maxSystemVisitCount, maxConnectionVisitCount){
//#region Setup
//Settings
  //#region SET BY USER//
    // Should the points and lines have a identical color scale? Will use the highest value from maxSystemVisitCount / maxConnectionVisitCount
  var _USER_USE_IDENTICAL_SCALE = false;
    //Should the maxSystemVisitCount/maxConnectionVisitCount be overwritten?
  var _USER_OVERRIDE_MAX_COUNT = true;
  var _USER_OVERRIDE_DEFINITIONS = {system:100,connection:10};

  // Should point/line size be affected by times visited?
  var _USER_VISIT_AFFECT_POINT_SIZE = true;
  var _USER_VISIT_AFFECT_LINE_SIZE = true;
    // Min/max point/line size (default is used if _USER_VISIT_AFFECT_LINE/POINT_SIZE is set to "false")
  var _SIZE_DEFINITIONS = {point:{min:2,max:10,default:5},line:{min:1,max:5,default:2}};

    // Color values (in hexdec) for maximum and minimum values
  var _COLOR_DEFINITIONS = {min:"#a30000",max:"#00ff00"};
  //#endregion END OF USER SET SETTINGS //
  canvas_width = 1440;
  canvas_height = 810;


  if(typeof maxSystemVisitCount === "undefined"){
    if(_USER_USE_IDENTICAL_SCALE){
      maxSystemVisitCount = maxConnectionVisitCount = 50;
    }
  }
  else{
    if(_USER_USE_IDENTICAL_SCALE){
      maxConnectionVisitCount = maxSystemVisitCount;
    }
  }
  if(_USER_OVERRIDE_DEFINITIONS){
    maxSystemVisitCount = _USER_OVERRIDE_DEFINITIONS.system;
    maxConnectionVisitCount = _USER_OVERRIDE_DEFINITIONS.connection;
  }
_systemList = systemList;
_connectionList = connectionList;
//Settings up canvas end adding it to the HTML document
  var scene_main = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 80, canvas_width/canvas_height,0.1,500000);
  camera.position.set(0.5,0.2,0.1);
  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(canvas_width,canvas_height);
  $("#3d_container").append(renderer.domElement);

//#region Check data for integrity
if(typeof logList !== "object"){
  console.error("No loglist passed");

}
else if(typeof logList[0].name === "undefined" || typeof logList[0].date === "undefined"){
  console.error("Given logs appear to have a wrong format.");
}
if(typeof systemList === "undefined"){
  console.error("No systemList passed");
}
if(typeof connectionList === "undefined"){
  console.error("No connectionList passed");
}
if(typeof maxSystemVisitCount === "undefined"){
  console.warn("no maxSystemVisitCount given. Using 50 as default");
  maxSystemVisitCount = 50;
}
else if(typeof maxSystemVisitCount !== "number"){
  console.warn("given maxSystemVisitCount is not a number!");
  maxSystemVisitCount = 50;
}
if(typeof maxConnectionVisitCount === "undefined"){
  console.warn("no maxConnectionVisitCount given. Using 50 as default.");
  maxConnectionVisitCount = 50;
}
else if(typeof maxConnectionVisitCount !== "number"){
  console.warn("given maxConnectionVisitCount is not a number!");
  maxConnectionVisitCount = 50;
}
//#endregion
//#region Draw Connection Lines
  for(var entry in connectionList){
    try{
      //skip loop if property is from prototype
      if(!connectionList.hasOwnProperty(entry)){continue;}
      var material = new THREE.LineBasicMaterial({color:getColorByCount(connectionList[entry].tosys1count+connectionList[entry].tosys2count),linewidth:getSizeByCount(connectionList[entry].tosys1count+connectionList[entry].tosys2count),transparent:true,opacity:0.7});
      var geometry = new THREE.Geometry();
      var system1 = systemList[connectionList[entry].sys1];
      //console.log(systemList);
      //console.log(connectionList);
      //console.log(connectionList[entry]);
      var system2 = systemList[connectionList[entry].sys2];
      geometry.vertices.push(new THREE.Vector3(system1.x,system1.y,system1.z),new THREE.Vector3(system2.x,system2.y,system2.z));
      var object = new THREE.Line(geometry,material);
      object.name = entry;
      scene_main.add(object);
    }
    catch(e){
      console.warn("Could not load connection");
      console.warn(e);
      //TODO: For some mysterious reason some systems do not exist in systemList. Black magic? They are in the SQLite DB and in the logs, but not in requiredSystems. So it's probably something in the c# program, which shouldnt be an issue when using a server, i hope.
    }
  }
//#endregion
//#region Draw System Dots

  for(var entry in systemList){

    //skip loop if property is from prototype
      if(!systemList.hasOwnProperty(entry)){ console.warn(entry);continue; }

      var material = new THREE.PointsMaterial({color: getColorByCount(systemList[entry].count,true),size: getSizeByCount(systemList[entry].count,true)});
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(
        systemList[entry].x,
        systemList[entry].y,
        systemList[entry].z
      ));
      var object = new THREE.Points(geometry,material);
      object.name = systemList[entry].name;
      scene_main.add(object);
      //console.log(object);
  }


//#endregion
//#region Color/Size Calculations
//                                \/-- Differentiate between point and line
  function getColorByCount(count,isPoint){
     let _scale = chroma.scale([_COLOR_DEFINITIONS.min,_COLOR_DEFINITIONS.max]).mode("lrgb");
    if(isPoint){
      //Point handling
      let fraction = ((count-1 / maxSystemVisitCount-1) > 1) ? 1 : (count-1/maxSystemVisitCount-1);
      console.log(fraction);
      return _scale(fraction).hex();
    }
    else{
      //Line handling
      let fraction = ((count-1 / maxConnectionVisitCount-1) > 1) ? 1 : (count-1/maxConnectionVisitCount-1);
      return _scale(fraction).hex();
    }
  }
//                                \/-- Differentiate between point and line
  function getSizeByCount(count,isPoint){
    if(isPoint){
      //Point handling
      //Visit count affecting size is disabled. Set Size to default value
      if(!_USER_VISIT_AFFECT_POINT_SIZE){
        return _SIZE_DEFINITIONS.point.default;
      }
      else{
        //Get size depending on count / maxCount. if maxCount > count set fraction to 1
        let fraction = ((count-1 / maxSystemVisitCount-1) > 1) ? 1 : (count-1/maxSystemVisitCount-1);
        //Return min value + fraction to max value
        return _SIZE_DEFINITIONS.point.min+fraction*_SIZE_DEFINITIONS.point.max;
      }
    }
    else{
      //Line Handling
      //Visit count affecting size is disabled. Set Size to default value.
      if(!_USER_VISIT_AFFECT_LINE_SIZE){
        return _SIZE_DEFINITIONS.line.default;
      }
      else{
        //Get size depending in count / maxCount. if maxCount > count set fraction to 1
        let fraction = ((count-1 / maxConnectionVisitCount-1) > 1) ? 1 : (count-1/maxConnectionVisitCount-1);
        //Return min value + fraction to max value
        return _SIZE_DEFINITIONS.line.min+fraction*_SIZE_DEFINITIONS.point.max;
      }
    }
  }
//#endregion
//#region Controls
//Controls Setup
var controls = new THREE.OrbitControls( camera );
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.keys = {
  LEFT:65,UP:87,RIGHT:68,DOWN:83
};
console.log(controls);
//#endregion

//#region animation loop at the end of loading
function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene_main,camera);
  controls.update();
}
animate();
//#endregion
}
