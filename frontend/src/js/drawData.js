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
    // Show Debug Data
  var _USER_DEBUG = true;
    // Should the points and lines have a identical color scale? Will use the highest value from maxSystemVisitCount / maxConnectionVisitCount
  var _USER_USE_IDENTICAL_SCALE = false;
    //Should the maxSystemVisitCount/maxConnectionVisitCount be overwritten?
  var _USER_OVERRIDE_MAX_COUNT = true;
  var _USER_OVERRIDE_DEFINITIONS = {system:50,connection:10};
  // Should point/line size be affected by times visited?
  var _USER_VISIT_AFFECT_POINT_SIZE = true;
  var _USER_VISIT_AFFECT_LINE_SIZE = true;
    // Min/max point/line size (default is used if _USER_VISIT_AFFECT_LINE/POINT_SIZE is set to "false")
  var _SIZE_DEFINITIONS = {point:{min:2,max:4,default:3},line:{min:1,max:10,default:2}};

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
  var isDefaultSceneDrawn = true;
//Settings up canvas end adding it to the HTML document
  var scene_skybox = new THREE.Scene();
  var scene_main = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 80, canvas_width/canvas_height,0.1,500000);
  camera.position.set(0.5,0.2,0.1);
  var renderer = new THREE.WebGLRenderer();
  renderer.autoClear = false;
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
  for(let entry in connectionList){
    try{
      //skip loop if property is from prototype
      if(!connectionList.hasOwnProperty(entry)){continue;}
      let material = getMaterialByCount(connectionList[entry].tosys1count+connectionList[entry].tosys2count,false);
      let geometry = new THREE.BufferGeometry();
      let system1 = systemList[connectionList[entry].sys1];
      let system2 = systemList[connectionList[entry].sys2];
      let vertices = new Float32Array([-system1.x,system1.y,system1.z,-system2.x,system2.y,system2.z]);
      geometry.addAttribute("position",new THREE.BufferAttribute(vertices,3));
      let object = new THREE.Line(geometry,material);
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

  for(let entry in systemList){

    //skip loop if property is from prototype
      if(!systemList.hasOwnProperty(entry)){ console.warn(entry);continue; }
      let material = getMaterialByCount(systemList[entry].count,true);
      let geometry = new THREE.BufferGeometry();
      let vertices = new Float32Array([-systemList[entry].x,systemList[entry].y,systemList[entry].z]);
      geometry.addAttribute("position",new THREE.BufferAttribute(vertices,3));
      let object = new THREE.Points(geometry,material);
      object.name = systemList[entry].name;
      scene_main.add(object);
  }


//#endregion
//#region Color/Size Calculations
  function getMaterialByCount(count,isPoint){
    let _scale = chroma.scale([_COLOR_DEFINITIONS.min,_COLOR_DEFINITIONS.max]).mode("lrgb");
    if(isPoint){
      //Point handling
      let fraction = (((count-1 / maxSystemVisitCount-1)*0.1) > 1) ? 1 : ((count-1/maxSystemVisitCount-1)*0.1);
      let color = _scale(fraction).hex();
      let size;
      if(_USER_VISIT_AFFECT_POINT_SIZE){
        size = _SIZE_DEFINITIONS.point.min + fraction * _SIZE_DEFINITIONS.point.max;
      }
      else{
        size = _SIZE_DEFINITIONS.point.default;
      }
      //return new THREE.PointsMaterial({color:color,size:size});
      //Generate Canvas for round dot
      let c = document.createElement("canvas");
      let ctx_size = 20;
      c.width = c.height = ctx_size;
      let ctx = c.getContext("2d");
      let texture = new THREE.Texture(c);
      ctx.beginPath();
      ctx.arc(ctx_size/2,ctx_size/2,ctx_size/2,0,2*Math.PI,false);
      ctx.fillStyle = color;
      ctx.fill();
      texture.needsUpdate = true;
      if(texture.minFilter !== THREE.NearestFilter && texture.minFilter !== THREE.LinearFilter){
        texture.minFilter = THREE.NearestFilter;
      }
      return new THREE.PointsMaterial({size:size,map:texture,transparent:true,depthWrite:false});
    }
    else{
      //Line handling
      let fraction = (((count-1 / maxConnectionVisitCount-1)*0.1) > 1) ? 1 : ((count-1/maxConnectionVisitCount-1)*0.1);
      let color = _scale(fraction).hex();
      let size;
      if(_USER_VISIT_AFFECT_LINE_SIZE){
        size = _SIZE_DEFINITIONS.line.min + fraction * _SIZE_DEFINITIONS.line.max;
      }
      else{
        size = _SIZE_DEFINITIONS.line.default;
      }
      return new THREE.LineBasicMaterial({color:color,linewidth:size,opacity:0.5+(fraction/2),transparent:true});
    }
  }
//#endregion
//#region Skybox
let skybox_material_data = [
  new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("src/img/skybox/north.png"),side:THREE.BackSide}),
  new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("src/img/skybox/south.png"),side:THREE.BackSide}),
  new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("src/img/skybox/up.png"),side:THREE.BackSide}),
  new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("src/img/skybox/down.png"),side:THREE.BackSide}),
  new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("src/img/skybox/east.png"),side:THREE.BackSide}),
  new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("src/img/skybox/west.png"),side:THREE.BackSide}),
];

let skybox = new THREE.Mesh(new THREE.CubeGeometry(100000,100000,100000),skybox_material_data);
skybox.rotation.set(0,-Math.PI/2,0);
console.log(skybox_material_data);

scene_skybox.add(skybox);
scene_skybox.add(new THREE.AmbientLight(0xFFFFFF,0.3));
//#endregion
//#region Controls
//Controls Setup
controls = new THREE.EDControls( camera , scene_main);
controls.minDistance = 10;
controls.maxDistance = 10000;
controls.enableDamping = true;
controls.dampingFactor = 1.5;
console.log(controls);
//#endregion
camera.rotation = new THREE.Euler();
//#region animation loop at the end of loading
function animate(){
  requestAnimationFrame(animate);
  update();
  if(isDefaultSceneDrawn){
    renderer.clear();
    renderer.render(scene_skybox,camera);
    renderer.clearDepth();
    renderer.render(scene_main,camera);
    controls.update();
  }
}
function update(){
  skybox.position.set(camera.position.x,camera.position.y,camera.position.z) ;
  //console.log(camera.position);
}
animate();
//#endregion
}
