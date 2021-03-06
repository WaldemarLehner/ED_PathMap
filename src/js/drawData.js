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
  var _USER_DEBUG = false;
    // Optimization Sectors
  var _USER_SECTOR_SIZE = 2500;
      //offset (x|y|z) in ly so there's no negative values in the ID of each sector
  var _USER_SECTOR_OFFSET = {
    x:50000 ,
    y:10000,
    z:20000
  };
    //The distance from when the Lines will no longer be drawn.
  const _USER_SECTOR_LINES_RENDER_DISTANCE = 25000;
    //The distance from when the Points will change to a simple dot representation
  const _USER_SECTOR_POINTS_RENDER_LOD1_DISTANCE = 5000;
    //The distance from when only a portion of the Points will be rendered
  const _USER_SECTOR_POINTS_RENDER_LOD2_DISTANCE = 20000;
    //How likely is it that a point gets drawn in LOD2 State?
  const _USER_SECTOR_POINTS_RENDER_LOD2_PERCENTAGE = 20;
    // Should the points and lines have a identical color scale? Will use the highest value from maxSystemVisitCount / maxConnectionVisitCount
  const _USER_USE_IDENTICAL_SCALE = false;
    //Should the maxSystemVisitCount/maxConnectionVisitCount be overwritten?
  const _USER_OVERRIDE_MAX_COUNT = false;
  const _USER_OVERRIDE_DEFINITIONS = {system:50,connection:10};
  // Should point/line size be affected by times visited?
  const _USER_VISIT_AFFECT_POINT_SIZE = true;
  const _USER_VISIT_AFFECT_LINE_SIZE = true;
    // Min/max point/line size (default is used if _USER_VISIT_AFFECT_LINE/POINT_SIZE is set to "false")
  const _SIZE_DEFINITIONS = {point:{min:2,max:4,default:3},line:{min:1,max:10,default:2}};

    // Color values (in hexdec) for maximum and minimum values
  const _COLOR_DEFINITIONS = {min:"#a30000",max:"#00ff00"};
  //#endregion END OF USER SET SETTINGS //
  var canvas_width = window.innerWidth;
  var canvas_height = window.innerHeight;
  var updatePointsThisCycle = false;

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
//Settings up canvas and adding it to the HTML document
  var scene_skybox = new THREE.Scene();
  var scene_main = new THREE.Scene();
  var scene_ui = new THREE.Scene();
  var scene_ui1 = new THREE.Scene();
  var scene_ui2 = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 80, canvas_width/canvas_height,0.1,600000);
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
if(_USER_SECTOR_POINTS_RENDER_LOD1_DISTANCE > _USER_SECTOR_POINTS_RENDER_LOD2_DISTANCE){
  throw "_USER_SECTOR_POINTS_RENDER_LOD1_DISTANCE shall not be larger than _USER_SECTOR_POINTS_RENDER_LOD2_DISTANCE!";
}
//#endregion
let linesRef = {};
let pointsRef = {};
let lines = new THREE.Group();
let points = new THREE.Group();
let _scale = chroma.scale([_COLOR_DEFINITIONS.min,_COLOR_DEFINITIONS.max]).mode("lrgb");
//#region Draw Connection Lines
let systemConnectionPositionBuffer = []; // x y z
let systemConnectionColorBuffer = []; // r g b
for(let entryID = 0;entryID < logList.length-1;entryID++){
  let thisSystem = logList[entryID].name;
  let nextSystem = logList[entryID+1].name;
  let connectionName = (thisSystem<nextSystem)?thisSystem+":"+nextSystem:nextSystem+":"+thisSystem;
  let count = connectionList[connectionName].tosys1count+connectionList[connectionName].tosys2count;
  //get color based on count/maxcount
  let fraction = (((count-1 / maxConnectionVisitCount-1)*0.1) > 1) ? 1 : ((count-1/maxConnectionVisitCount-1)*0.1);
  let color = new THREE.Color(_scale(fraction).num());
  systemConnectionPositionBuffer.push(-systemList[thisSystem].x,systemList[thisSystem].y,systemList[thisSystem].z);
  systemConnectionColorBuffer.push(color.r,color.g,color.b);
  if(entryID === logList.length-2){
    systemConnectionPositionBuffer.push(-systemList[nextSystem].x,systemList[nextSystem].y,systemList[nextSystem].z);
    systemConnectionColorBuffer.push(color.r,color.g,color.b);
  }
}
let lineGeometry = new THREE.BufferGeometry();
lineGeometry.addAttribute("position",new THREE.Float32BufferAttribute(systemConnectionPositionBuffer,3));
lineGeometry.addAttribute("color",new THREE.Float32BufferAttribute(systemConnectionColorBuffer,3));
let lineObject = new THREE.Line(lineGeometry,new THREE.LineBasicMaterial({
  color: 0xFFFFFF,
  vertexColors: THREE.VertexColors,
  opacity: 0.3,
  transparent: true
}));
scene_main.add(lineObject);
//First seperate in individual sectors
//#endregion
//#region Draw System Dots
//#region pregenerate required materials
let systemPointTexture = generateSystemPointTexture();
function generateSystemPointTexture(){
  let ret = [];
  for(let i = 0;i < 3;i++){

    let canvas = document.createElement("canvas");
    if(i===0)canvas.width = canvas.height = 64;
    else if(i===1)canvas.width = canvas.height = 16;
    let ctx = canvas.getContext("2d");
    let tex = new THREE.Texture(canvas);

    ctx.beginPath();
    ctx.arc(canvas.width/2,canvas.height/2,canvas.height/2-2,0,2*Math.PI);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    tex.needsUpdate = true;
    if(tex.minFilter !== THREE.NearestFilter && tex.minFilter !== THREE.LinearFilter){
      tex.minFilter = THREE.NearestFilter;
    }
    ret[i] = tex;
  }
  return ret;

}
//#endregion
//Generate an object made up of all sectors
let pointSectors = generateSectorList_points();
//Iterate through all sectors and generate 2 merged geometries (LOD0+LOD1,LOD2) and generate 3 Points objects
for(let sector in pointSectors){
  if(!pointSectors.hasOwnProperty(sector)){continue;}
  let geometryLOD0 = new THREE.BufferGeometry();
  let geometryLOD2 = new THREE.BufferGeometry();
  //position component
  let geoLOD0Vertices = [];
  let geoLOD2Vertices = [];
  //color component
  let geoLOD0Colors = [];
  let geoLOD2Colors = [];
  //size component
  let geoLOD0Size = [];
  for(let sysIndex = 0;sysIndex < pointSectors[sector].length;sysIndex++){
    let c = pointSectors[sector][sysIndex];
    let sysCount = maxSystemVisitCount;
    let fraction = (((c.count-1 / sysCount-1)*0.1) > 1) ? 1 : ((c.count-1/sysCount-1)*0.1);
    let color = new THREE.Color(_scale(fraction).num());
    let size =  (_USER_VISIT_AFFECT_POINT_SIZE) ? ( _SIZE_DEFINITIONS.point.min + fraction * _SIZE_DEFINITIONS.point.max) : (_SIZE_DEFINITIONS.point.default);
    //-----
    geoLOD0Vertices.push(c.coords.x-_USER_SECTOR_SIZE,c.coords.y-_USER_SECTOR_SIZE,c.coords.z-_USER_SECTOR_SIZE);
    geoLOD0Colors.push(color.r,color.g,color.b);
    geoLOD0Size.push(size);
    //Have a chance to add to LOD2 aswell
    if( Math.random() < _USER_SECTOR_POINTS_RENDER_LOD2_PERCENTAGE/100 ){
      geoLOD2Vertices.push(c.coords.x-_USER_SECTOR_SIZE,c.coords.y-_USER_SECTOR_SIZE,c.coords.z-_USER_SECTOR_SIZE);
      geoLOD2Colors.push(color.r,color.g,color.b);
    }
  }
  //LOD 0
  geometryLOD0.addAttribute("position",new THREE.Float32BufferAttribute(geoLOD0Vertices,3));
  geometryLOD0.addAttribute("customColor",new THREE.Float32BufferAttribute(geoLOD0Colors,3));
  geometryLOD0.addAttribute("size",new THREE.Float32BufferAttribute(geoLOD0Size,1));
  geometryLOD0.computeBoundingSphere();
  //LOD 2
  geometryLOD2.addAttribute("position",new THREE.Float32BufferAttribute(geoLOD2Vertices,3));
  geometryLOD2.addAttribute("color",new THREE.Float32BufferAttribute(geoLOD2Colors,3));
  geometryLOD2.computeBoundingSphere();
  //Wait for all shaders to load - if it takes longer than 5 s → throw error
  let t0 = Date.now();
  let __SHADERS = {
    vertex:"uniform float amplitude;attribute float size;attribute vec3 customColor;varying vec3 vColor;void main() {vColor = customColor;vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );gl_PointSize = size * ( 300.0 / -mvPosition.z );gl_Position = projectionMatrix * mvPosition;}",
    fragment:"uniform vec3 color;uniform sampler2D texture;varying vec3 vColor;void main() {gl_FragColor = vec4( color * vColor, 1.0 );gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );}"
  };

  let LOD0Shader = new THREE.ShaderMaterial({
    vertexShader: __SHADERS.vertex,
    fragmentShader: __SHADERS.fragment,
    uniforms:{
      amplitude: {value:1.0},
      color: {value: new THREE.Color(0xFFFFFF)},
      texture: {value: systemPointTexture[0]}
    },
    depthTest:false,
    transparent:true
  });
  let LOD1Shader = new THREE.ShaderMaterial({
    vertexShader: __SHADERS.vertex,
    fragmentShader: __SHADERS.fragment,
    uniforms:{
      amplitude: {value:1.0},
      color: {value: new THREE.Color(0xFFFFFF)},
      texture: {value: systemPointTexture[1]}
    },
    depthTest:false,
    transparent:true
  });
  let LOD2Shader = new THREE.PointsMaterial({
    vertexColors: THREE.VertexColors,
    size:2
  });

  let pointsLOD0 = new THREE.Points(geometryLOD0,LOD0Shader);
  let pointsLOD1 = new THREE.Points(geometryLOD0,LOD1Shader);
  let pointsLOD2 = new THREE.Points(geometryLOD2,LOD2Shader);
  pointsLOD0.visible = true;
  pointsLOD1.visible = false;
  pointsLOD2.visible = false;
  let root = new THREE.Group();
  //get Sector coordinates
  let sectorCoords = sector.split(":");
  for(let i = 0;i<3;i++){
    sectorCoords[i] = Number(sectorCoords[i]);
  }

  let posX = ((sectorCoords[0] * _USER_SECTOR_SIZE) - _USER_SECTOR_OFFSET.x)+0.5*_USER_SECTOR_SIZE;
  let posY = ((sectorCoords[1] * _USER_SECTOR_SIZE) - _USER_SECTOR_OFFSET.y)+0.5*_USER_SECTOR_SIZE;
  let posZ = ((sectorCoords[2] * _USER_SECTOR_SIZE) - _USER_SECTOR_OFFSET.z)+0.5*_USER_SECTOR_SIZE;
  root.position.set(posX,posY,posZ);
  root.add(pointsLOD0);
  root.add(pointsLOD1);
  root.add(pointsLOD2);
  pointsRef[sector] = root;

}
function generateSectorList_points(){
  let sectors = {};
  for(let system in systemList){
    if(!systemList.hasOwnProperty(system)){continue;}
    let coords = {
      x: -systemList[system].x,
      y: systemList[system].y,
      z: systemList[system].z
    };
    //Check if Sector exists; If not: create new sector
    let sectorCoords = getSectorCoordinates(coords.x,coords.y,coords.z);
    //Make the "anker" the sector itself, not ( 0 | 0 | 0 )
    let coords_sector = {
      x: coords.x - ((sectorCoords.x * _USER_SECTOR_SIZE) - _USER_SECTOR_OFFSET.x)+0.5*_USER_SECTOR_SIZE,
      y: coords.y - ((sectorCoords.y * _USER_SECTOR_SIZE) - _USER_SECTOR_OFFSET.y)+0.5*_USER_SECTOR_SIZE,
      z: coords.z - ((sectorCoords.z * _USER_SECTOR_SIZE) - _USER_SECTOR_OFFSET.z)+0.5*_USER_SECTOR_SIZE
    };
    let sectorName = sectorCoords.x+":"+sectorCoords.y+":"+sectorCoords.z;
    if(typeof sectors[sectorName] === "undefined"){
      //set up a new sector, as the one where the system is in does not exist yet.
      sectors[sectorName] = [];
    }
    sectors[sectorName].push({coords:coords_sector,count:systemList[system].count});
  }
  return sectors;
}
//#endregion
//#region Sector Functions

for(let entry in pointsRef){
  if(!pointsRef.hasOwnProperty(entry)){
    continue;
  }
  scene_main.add(pointsRef[entry]);
}
//get LOD calculations when initializing
for(let entry in pointsRef){
  if(!pointsRef.hasOwnProperty(entry)){
    continue;
  }
  let dist = pointsRef[entry].position.distanceTo(camera.position);
  if(dist < _USER_SECTOR_POINTS_RENDER_LOD1_DISTANCE){
    pointsRef[entry].userData.lodState = 0;
    pointsRef[entry].children[0].visible = true;
    pointsRef[entry].children[1].visible = false;
    pointsRef[entry].children[2].visible = false;
  }
  else if(dist < _USER_SECTOR_POINTS_RENDER_LOD2_DISTANCE){
    pointsRef[entry].userData.lodState = 1;
    pointsRef[entry].children[0].visible = false;
    pointsRef[entry].children[1].visible = true;
    pointsRef[entry].children[1].visible = false;
  }
  else{
    pointsRef[entry].userData.lodState = 2;
    pointsRef[entry].children[0].visible = false;
    pointsRef[entry].children[1].visible = false;
    pointsRef[entry].children[2].visible = true;
  }
}

function getSectorCoordinates(x1,y1,z1){
  let size = _USER_SECTOR_SIZE;
  let offset = _USER_SECTOR_OFFSET;
  let x = Math.floor((x1+offset.x)/size);
  let y = Math.floor((y1+offset.y)/size);
  let z = Math.floor((z1+offset.z)/size);
  return {x:x,y:y,z:z};
}
function updateLOD(){
    //Point Handling
for(let entry in pointsRef){
  let dist = pointsRef[entry].position.distanceTo(camera.position);
  let e = pointsRef[entry];

  if(dist < _USER_SECTOR_POINTS_RENDER_LOD1_DISTANCE){
    if(pointsRef[entry].userData.lodState !== 0){
      pointsRef[entry].userData.lodState = 0;
        e.children[0].visible = true;
        e.children[1].visible = false;
        e.children[2].visible = false;
    }
  }
  else if(dist < _USER_SECTOR_POINTS_RENDER_LOD2_DISTANCE){
    if(pointsRef[entry].userData.lodState !== 1){
      if(pointsRef[entry].userData.lodState === 2){
        e.userData.lodState = 1;
        e.children[0].visible = e.children[2].visible = false;
        e.children[1].visible = true;
      }
    }
  }
  else{
    if(pointsRef[entry].userData.lodState !== 2){
      pointsRef[entry].userData.lodState = 2;
        e.children[0].visible = e.children[1].visible = false;
        e.children[2].visible = true;
    }
  }
}
}

//#endregion
//#region Skybox
UI.Loader.updateText1();
UI.Loader.updateText2("Load skybox images.");
let skybox_url = (typeof __DATASOURCE__.skybox)?__DATASOURCE__.default+"/src/img/skybox/":__DATASOURCE__.skybox;
let skybox_material_data = [
  new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load(skybox_url+"north.png"),side:THREE.BackSide}),
  new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load(skybox_url+"south.png"),side:THREE.BackSide}),
  new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load(skybox_url+"up.png"),side:THREE.BackSide}),
  new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load(skybox_url+"down.png"),side:THREE.BackSide}),
  new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load(skybox_url+"east.png"),side:THREE.BackSide}),
  new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load(skybox_url+"west.png"),side:THREE.BackSide}),
];

let skybox = new THREE.Mesh(new THREE.CubeGeometry(500000,500000,500000),skybox_material_data);
skybox.rotation.set(0,-Math.PI/2,0);


scene_skybox.add(skybox);
//scene_skybox.add(new THREE.AmbientLight(0xFFFFFF,0.3));
//#endregion
//#region Galactic Plane
//Draw a galactic plane
let galmaptexture = new THREE.TextureLoader().load(
  (typeof __DATASOURCE__.galplane === "undefined")?__DATASOURCE__.default+"src/img/skybox/galplane.png":__DATASOURCE__.galplane
);
galmaptexture.minFilter =  THREE.LinearFilter;
let galplane_material = new THREE.MeshBasicMaterial( {map: galmaptexture, side:THREE.DoubleSide,color:0xFFFFFF,transparent:true,opacity:0.8} );
let galplane = new THREE.Mesh(new THREE.PlaneGeometry(100000,100000),galplane_material);
galplane.rotation.set(Math.PI/2,0,0);
galplane.position.set(0,0,26000);
galplane.name = "galplane";
scene_skybox.add(galplane);
//#endregion
//#region Controls
//Controls Setup
var controls = new THREE.EDControls( camera , scene_main);
controls.minDistance = 10;
controls.maxDistance = 10000;


//#endregion
camera.rotation = new THREE.Euler();
//#region animation loop at the end of loading
function animate(){
  requestAnimationFrame(animate);
  update();
  updateLOD(updatePointsThisCycle);
  if(isDefaultSceneDrawn){
    renderer.clear();
    renderer.render(scene_skybox,camera);
    renderer.clearDepth();
    renderer.render(scene_main,camera);
    renderer.clearDepth();
    renderer.render(scene_ui,camera);
    renderer.clearDepth();
    renderer.render(scene_ui1,camera);
    renderer.clearDepth();
    renderer.render(scene_ui2,camera);
    controls.update();
  }
}
function update(){
  skybox.position.set(camera.position.x,camera.position.y,camera.position.z);
  let galplane = scene_skybox.getObjectByName("galplane");
  if(typeof galplane !== "undefined"){
    let galplane_distance = camera.position.y-galplane.position.y;
    if(galplane_distance < 0){
      galplane_distance *= -1;
    }
    if(galplane_distance > 2000){
      galplane_distance = 2000;
    }
    // f\left(x\right)=.5-.5\cos\left(\frac{2\pi}{a\cdot2}x\right)
    let galplane_opacity = 0.5-0.5*Math.cos((2*Math.PI/4000)*galplane_distance);
    if(galplane.material.opacity !== galplane_opacity){
      galplane.material.opacity = galplane_opacity;
    }
  }

}
//Add an Interface to global scope
window.canvasInterface = new PATHMAP.Interface(camera,[scene_skybox,scene_main,scene_ui,scene_ui1,scene_ui2],controls,lineObject,pointsRef,logList,systemList);

//Start with animation loop
UI.Loader.updateText2("Done");
setTimeout(function(){
  UI.Loader.hide();
},1000);
canvasInterface.focus.last(true);
UI.update();
animate();
window.addEventListener("resize",function(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
},false);
//#endregion
}
