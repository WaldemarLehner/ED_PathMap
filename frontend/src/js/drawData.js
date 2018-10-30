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
  for(let entry in connectionList){
    try{
      //skip loop if property is from prototype
      if(!connectionList.hasOwnProperty(entry)){continue;}
      let system1 = systemList[connectionList[entry].sys1];
      let system2 = systemList[connectionList[entry].sys2];
      let x1 = -system1.x;
      let y1 = system1.y;
      let z1 = system1.z;
      let x2 = -system2.x;
      let y2 = system2.y;
      let z2 = system2.z;
      //Use System1 as the reference point to determine to which Sector the connection belongs to.
      let sectorCoords = getSectorCoordinates(x1,y1,z1);
      let sectorName = sectorCoords.x+":"+sectorCoords.y+":"+sectorCoords.z;
      let group;
      let posX,posY,posZ;
      if(typeof linesRef[sectorName] === "undefined"){
        group = new THREE.Group();
        group.name = sectorName;
      }else{
        group = linesRef[sectorName];
      }
      posX = ((sectorCoords.x * _USER_SECTOR_SIZE) - _USER_SECTOR_OFFSET.x)+0.5*_USER_SECTOR_SIZE;
      posY = ((sectorCoords.y * _USER_SECTOR_SIZE) - _USER_SECTOR_OFFSET.y)+0.5*_USER_SECTOR_SIZE;
      posZ = ((sectorCoords.z * _USER_SECTOR_SIZE) - _USER_SECTOR_OFFSET.z)+0.5*_USER_SECTOR_SIZE;

      group.position.set(posX,posY,posZ);
      //Material Generation
      let count = (connectionList[entry].tosys1count+connectionList[entry].tosys2count);
      let fraction = (((count-1 / maxConnectionVisitCount-1)*0.1) > 1) ? 1 : ((count-1/maxConnectionVisitCount-1)*0.1);
      let material = new THREE.LineBasicMaterial({color:new THREE.Color(_scale(fraction).num()),opacity:0.5+(fraction/2),transparent:true});
      let geometry = new THREE.BufferGeometry();
      let vertices = new Float32Array([(x1-posX),y1-posY,z1-posZ,(x2-posX),y2-posY,z2-posZ]);
      geometry.addAttribute("position",new THREE.BufferAttribute(vertices,3));
      let object = new THREE.Line(geometry,material);
      object.name = entry;
      group.userData = {lockVisibility:false};
      group.add(object);
      linesRef[sectorName] = group;
    }
    catch(e){
      console.warn("Could not load connection");
      console.warn(e);
    }
  }

//#endregion
//#region Draw System Dots
//#region pregenerate required materials
let systemDotTextureList = generateDotTextures(maxSystemVisitCount,maxConnectionVisitCount);
console.log(systemDotTextureList);
//systemDotTextureList.high = generateLOD0DotTexture();
/*function generateLOD0DotTexture(){
  let c = document.createElement("canvas");
  let ctx_size = 32;
  c.width = c.height = ctx_size;
  let ctx = c.getContext("2d");
  let texture = new THREE.Texture(c);
  ctx.beginPath();
  ctx.arc(ctx_size/2,ctx_size/2,ctx_size/2,0,2*Math.PI,false);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  texture.needsUpdate = true;
  if(texture.minFilter !== THREE.NearestFilter && texture.minFilter !== THREE.LinearFilter){
    texture.minFilter = THREE.NearestFilter;
  }
  return new THREE.PointsMaterial({size:1,color:0xFFFFFF,map:texture,transparent:true,depthWrite:false});
}*/
function generateDotTextures(sysCount,connCount){
  let mat_group_points_LOD0 = [];
  let mat_group_points_LOD1 = [];
  //Generate LOD0 textures for systems that have been visited 1 times → sysCount Times
  for(let i = 0; i < sysCount;i++){
    let fraction = (((i-1 / sysCount-1)*0.1) > 1) ? 1 : ((i-1/sysCount-1)*0.1);
    let c = document.createElement("canvas");
    let ctx_size = 32;
    c.width = c.height = ctx_size;
    let ctx = c.getContext("2d");
    let tex = new THREE.Texture(c);
    ctx.beginPath();
    ctx.arc(ctx_size/2,ctx_size/2,ctx_size/2-2,0,2*Math.PI,false);
    ctx.fillStyle = _scale(fraction).hex();
    ctx.fill();
    tex.needsUpdate = true;
    if(tex.minFilter !== THREE.NearestFilter && tex.minFilter !== THREE.LinearFilter){
      tex.minFilter = THREE.NearestFilter;
    }
    let size =  (_USER_VISIT_AFFECT_POINT_SIZE) ? ( _SIZE_DEFINITIONS.point.min + fraction * _SIZE_DEFINITIONS.point.max) : (_SIZE_DEFINITIONS.point.default);
    let mat0 = new THREE.PointsMaterial({size:size,color:0xFFFFFF,map:tex,transparent:true,depthWrite:false});
    mat_group_points_LOD0[i] = mat0;
    let mat1 = new THREE.PointsMaterial({size:size,color: _scale(fraction).num()});
    mat_group_points_LOD1[i] = mat1;
  }
  return [mat_group_points_LOD0,mat_group_points_LOD1];
}
//#endregion
// ---
/* LEGACY CODE. REMOVE ASAP
  for(let entry in systemList){

    //skip loop if property is from prototype
      if(!systemList.hasOwnProperty(entry)){ console.warn(entry);continue; }
      //System Coords
      let x = -systemList[entry].x;
      let y = systemList[entry].y;
      let z = systemList[entry].z;
      //Check if Sector exists; If not: create new sector
      let sectorCoords = getSectorCoordinates(x,y,z);
      let sectorName = sectorCoords.x+":"+sectorCoords.y+":"+sectorCoords.z;
      let group,LOD0,LOD1;
      if(typeof pointsRef[sectorName] === "undefined"){
        group = new THREE.Group();
        group.name = sectorName;
        LOD0 = new THREE.Group();
        LOD0.name = "LOD0 @ "+sectorName;
        LOD1 = new THREE.Group();
        LOD1.name = "LOD1 @ "+sectorName;
      }else{
        group = pointsRef[sectorName];
        LOD0 = group.children[0];
        LOD1 = group.children[1];
      }
      let posX = ((sectorCoords.x * _USER_SECTOR_SIZE) - _USER_SECTOR_OFFSET.x)+0.5*_USER_SECTOR_SIZE;
      let posY = ((sectorCoords.y * _USER_SECTOR_SIZE) - _USER_SECTOR_OFFSET.y)+0.5*_USER_SECTOR_SIZE;
      let posZ = ((sectorCoords.z * _USER_SECTOR_SIZE) - _USER_SECTOR_OFFSET.z)+0.5*_USER_SECTOR_SIZE;
      let count = systemList[entry].count;
      let fraction = (((count-1 / maxSystemVisitCount-1)*0.1) > 1) ? 1 : ((count-1/maxSystemVisitCount-1)*0.1);
      //generate the Dots. Vertices can be used for LOD0 and LOD1;
      let color = _scale(fraction).num();
      //let material = new THREE.PointsMaterial();
      let material = systemDotTextureList.high.clone();
      material.color.setHex(color);
      material.size = (_USER_VISIT_AFFECT_POINT_SIZE) ? ( _SIZE_DEFINITIONS.point.min + fraction * _SIZE_DEFINITIONS.point.max) : (_SIZE_DEFINITIONS.point.default);

      group.position.set(posX,posY,posZ);
      let geometry = new THREE.BufferGeometry();
      let vertices = new Float32Array([x-posX,y-posY,z-posZ]);
      geometry.addAttribute("position",new THREE.BufferAttribute(vertices,3));
      let objectLOD0 = new THREE.Points(geometry,material);
      objectLOD0.position.set(posX,posY,posZ);
      objectLOD0.name = systemList[entry].name;
      LOD0.add(objectLOD0);
      let objectLOD1 = new THREE.Points(geometry,new THREE.PointsMaterial({color:color}));
      objectLOD1.position.set(posX,posY,posZ);
      LOD1.add(objectLOD1);
      LOD1.visible = false;
      group.userData = {lodState:0};
      group.children[0] = LOD0;
      group.children[1] = LOD1;
      pointsRef[sectorName] = group;

  }
*/
//Generate an object made up of all sectors
let pointSectors = generateSectorList_points();
console.log(pointSectors);
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
  geometryLOD0.addAttribute("color",new THREE.Float32BufferAttribute(geoLOD0Colors,3));
  geometryLOD0.addAttribute("size",new THREE.Float32BufferAttribute(geoLOD0Size,1));
  geometryLOD0.computeBoundingSphere();
  //LOD 2
  geometryLOD2.addAttribute("position",new THREE.Float32BufferAttribute(geoLOD2Vertices,3));
  geometryLOD2.addAttribute("color",new THREE.Float32BufferAttribute(geoLOD2Colors,3));
  geometryLOD2.computeBoundingSphere();
  //Wait for all shaders to load - if it takes longer than 5 s → throw error
  let t0 = Date.now();
  while(typeof __SHADERS.LOD0.vertex === "undefined" || typeof __SHADERS.LOD0.fragment === "undefined"){
    if(Date.now()-t0 > 5000){
      throw "Could not retrieve Shader files.";
    }
  }
  let LOD0Shader = new THREE.ShaderMaterial({
    vertexShader: __SHADERS.LOD0.vertex,
    fragmentShader: __SHADERS.LOD0.fragment,
    uniforms:{
      map:{
        value:systemDotTextureList[0][0]
      }
    }
  });

  let pointsLOD0 = new THREE.Points(geometryLOD0,LOD0Shader);
  let pointsLOD1 = new THREE.Points(geometryLOD0,systemDotTextureList[1][10]);
  let pointsLOD2 = new THREE.Points(geometryLOD2,systemDotTextureList[1][5]);
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
for(let entry in linesRef){
  if(!linesRef.hasOwnProperty(entry)){
    continue;
  }
  scene_main.add(linesRef[entry]);
}
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
function updateLOD(bool){
  if(bool){
    updatePointsThisCycle = false;
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
  else{
    updatePointsThisCycle = true;
    //Lines Handling
    for(let entry in linesRef){
      let dist = linesRef[entry].position.distanceTo(camera.position);
      if(linesRef[entry].userData.lockVisibility === false){
        if(dist > _USER_SECTOR_LINES_RENDER_DISTANCE){
          //Dont render sector
          linesRef[entry].visible = false;
        }else{
          linesRef[entry].visible = true;
        }
      }
    }
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

let skybox = new THREE.Mesh(new THREE.CubeGeometry(500000,500000,500000),skybox_material_data);
skybox.rotation.set(0,-Math.PI/2,0);


scene_skybox.add(skybox);
//scene_skybox.add(new THREE.AmbientLight(0xFFFFFF,0.3));
//#endregion
//#region Galactic Plane
//Draw a galactic plane
let galplane_material = new THREE.MeshBasicMaterial( {map: new THREE.TextureLoader().load("src/img/skybox/galplane.png"), side:THREE.DoubleSide,color:0xFFFFFF,transparent:true,opacity:0.8} );
let galplane = new THREE.Mesh(new THREE.PlaneGeometry(100000,100000),galplane_material);
galplane.rotation.set(Math.PI/2,0,0);
galplane.position.set(0,0,26000);
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
    controls.update();
  }
}
function update(){
  skybox.position.set(camera.position.x,camera.position.y,camera.position.z);
}
//Add an Interface to global scope
window.canvasInterface = new PATHMAP.Interface(camera,[scene_skybox,scene_main,scene_ui],controls,linesRef,pointsRef,logList,systemList);

//Start with animation loop
animate();
window.addEventListener("resize",function(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
},false);
//#endregion
}
