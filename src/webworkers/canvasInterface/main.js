//This is the Webworker / Script (on envs that dont support canvas webworkers) that interfaces with the THREE Context.
let insideWorker = require("offscreen-canvas/inside-worker");
let THREE = require("three");
let canvasDimensions = {
	x: 1920,
	y: 1080
};
/** @type {HTMLCanvasElement} */
let canvas;
//init
/**		@type {boolean[]} Has all active scenes as true, inactive as false*/
let activeScenes = [];
/**		@type {THREE.Scene[]} */
let scenes = [];
/**		@type {THREE.PerspectiveCamera}*/
let camera;
/**		@type {THREE.WebGLRenderer}*/
let renderer;
/**		@type {THREE.Object3D} */
let skybox;
/**		@type {THREE.Object3D} */
let galplane;
/**		@type {THREE.Object3D} */
let sectors;

//#region [rgba(255,255,255,0.05)] Preload images
let preloadedImages = {
	skybox: [], // front, back,right,left,top,bottom
	galplane: undefined,
	sectors: undefined,
	focusIndicator: [] //pan,vertical,circle
};
let preloadImagesCounter = 0; //when counter at 6+2+3 = 11, all neccesary images have been preloaded

let preloadSrc = require("../../configuration/__DATASOURCE__CANVAS__").preload;

/**
 * @readonly
 * @typedef preloadSrc
 * @property {string[]} skybox
 * @property {string} galplane
 * @property {string} sectors
 * @property {string[]} focusIndicator
 */

/**
 * @param {preloadSrc} imgs 
 */
function preloadImages(imgs){
	
	let imgloader = (worker.isWorker) ? new THREE.ImageBitmapLoader() : new THREE.ImageLoader();
	imgs.skybox.forEach((url, index) => {
		imgloader.load(url, (texture) => {
			preloadedImages.skybox[index] = texture;
			preloadAddToCounter();
		});
	});
	imgs.focusIndicators.forEach((url,index)=>{
		imgloader.load(url,(texture)=>{
			preloadedImages.focusIndicator[index] = texture;
			preloadAddToCounter();
		});
	});
	imgloader.load(imgs.galplane,(texture)=>{
		preloadedImages.galplane = texture;
		preloadAddToCounter();
	});
	imgloader.load(imgs.sectors,(texture)=>{
		preloadedImages.sectors = texture;
		preloadAddToCounter();
	});
}
function preloadAddToCounter(){
	preloadImagesCounter++;
	
	if(preloadImagesCounter === 11){	
		// TODO: callback indicating all sources have been successfully loaded
		worker.post([{ cmd: "UI", params: { loaderIDFinished:"FinishImageLoading",smallText: "Finished preloading images."}}]);
		initSkybox();
		initGalmap();
		initSectors();
	}
	// eslint-disable-next-line indent
//#endregion
	// eslint-disable-next-line indent
//#region [rgba(0,0,200,0.05)] Init functions
	function initSkybox(){
		let textures = preloadedImages.skybox;
		let materials = [];
		textures.forEach((texture)=>{
			let material = new THREE.MeshBasicMaterial({map: texture,side:THREE.BackSide});
			materials.push(material);
		});
		skybox = new THREE.Mesh(new THREE.BoxGeometry(500000, 500000, 500000),materials);
		skybox.rotation.set(0, -Math.PI/2, 0);
		scenes[0].add(skybox);
		indicatePreparationDoneIfReady();
	}

	function initGalmap(){
		/**@type {THREE.Texture} */
		let texture = preloadedImages.galplane;
		texture.minFilter = THREE.LinearFilter;
		let material = new THREE.MeshBasicMaterial({map: texture,side:THREE.DoubleSide,color:0xFFFFFF,transparent:true,opacity:.8});
		galplane = new THREE.Mesh(new THREE.PlaneGeometry(100000,100000),material);
		scenes[0].add(galplane);
		hasBeenDrawn[0] = true;
		indicatePreparationDoneIfReady();
		
	}

	function initSectors(){
		/**@type {THREE.Texture} */
		let texture = preloadedImages.sectors;
		texture.minFilter = THREE.LinearFilter;
		let material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, color: 0xFFFFFF, transparent: true, opacity: .8 });
		sectors = new THREE.Mesh(new THREE.PlaneGeometry(100000, 100000), material);
		scenes[1].add(sectors);
		hasBeenDrawn[1] = true;
		indicatePreparationDoneIfReady();
	}
}

//#endregion




const worker = insideWorker(msg => {
	preloadImages(preloadSrc);
	let data = msg.data;
	if(typeof data.canvas === "object"){
		
		canvas = data.canvas;
		canvasDimensions = {
			x: canvas.width,
			y: canvas.height
		};
		renderer = new THREE.WebGLRenderer({
			canvas,antialias:true
		});
		//init the scene
		if(typeof data.canvas.style === "undefined"){
			data.canvas.style = {
				width: canvasDimensions.x,
				height: canvasDimensions.y
			};
		}
		camera = new THREE.PerspectiveCamera(75,canvasDimensions.x/canvasDimensions.y,0.1,Infinity);
		updateFrustumPlane(canvasDimensions.x,canvasDimensions.y);
		worker.post([{ cmd: "UI", params: { loaderIDFinished: "StartCanvasWorker", smallText: "Finished initializing canvas worker" } }]);

	}
	//If the passed data is not empty...
	if (typeof data !== "undefined") {
		if(Array.isArray(data)){
			data.forEach(el => {
				buildCommandAndExecute(el);
			});
		}else{
			buildCommandAndExecute(data);
		}

	}
});
// ----------- only function declarations and API beneath this line

function buildCommandAndExecute(data){
	let command = getCommandFromCMDString(data.cmd);
	if (typeof command === "function") {
		command(data.params);
	}
}

function animate(){
	updateSkyboxPosition();

	scenes.forEach((scene,index)=>{
		if(activeScenes[index] === true){ //Skip drawing of scene when disabled
			renderer.render(scene,camera);
			renderer.autoClear = false;
		}
	});
	renderer.autoClear = true;
}




/**
 @param {string} string The command as string
 */
function getCommandFromCMDString(string){	//"a.b.c.d"
	if(typeof string !== "string"){
		return;
	}
	let regexp = /[a-zA-z]+/;
	let strings = string.split(".");
	strings.forEach((substr)=>{
		if(!substr.match(regexp))
			returnError("Passed command has Illegal Characters! Allowed characters are a-zA-z.");
	});
	try{
		let command = eval("API."+strings.join("."));	// API.a.b.c.d 
		
		if(typeof command !== "function"){
			throw new Error("API point does not exist");
		}
		return command;
	}catch(err){
		//Error thrown when the API point does not exist
		returnError(err);
	}

}


function returnError(dataToReturn){
	worker.post(["error",dataToReturn]);
}


//#region [rgba(255,255,0,0.02)] API
//eslint is wrong here. It is being called using eval.
// eslint-disable-next-line no-unused-vars
const API = {
	get: {
		skybox:{
			isHidden: () => { return (activeScenes[0] === true) ? true : false; } //the === true is to handle undefined
		},
		galplane:{
			isHidden: () => { return (activeScenes[1] === true) ? true : false; } //the === true is to handle undefined
		},
		sectors: {
			isHidden: () => { return (activeScenes[2] === true) ? true : false; } //the === true is to handle undefined
		},
		scenes: {
			isSceneUsed: (x)=>{return typeof scenes[x] !== "undefined";} //takes a num as arg, checks if it exists
		},
		camera: {
			position: getCameraPosition,
			rotation: getCameraRotation
		}
	},
	set: {
		skybox:{
			hide: () => { showHideScene(0, false); },
			show: () => { showHideScene(0, true); }
		},
		galplane:{
			hide: () => { showHideScene(1, false); },
			show: () => { showHideScene(1, true); }
		},
		sectors:{
			hide: () => { showHideScene(2, false); },
			show: () => { showHideScene(2, true); }
		},
		drawConnectionLines: drawConnectionLines,
		drawSystemPoints: drawSystemPoints,
		scenes:{
			showHideScene: showHideScene,
			addScene: undefined, 	//Warning. Scene 0 is reserved for Skybox, 
			//Scene 1 for Galplane, Scene 2 for Sectors, Scene 3 for Connection Lines, Scene 4 for System Points
			clearScene: undefined
		},
		camera:{
			position: setCameraPosition,
			rotation: setCameraRotation,
			update: updateFrustumPlane //when the view changes (resizing for example), the camera's projection matrix needs to be updated.
		}
	}
};
//#endregion
/**
 * 
 * @param {number} width A value > 0, defines the width of the canvas
 * @param {number} height A value > 0, defines the height of the canvas
 */
function updateFrustumPlane(width,height){
	if(width <= 0 || height <= 0){
		throw "Values cannot be smaller than 0.";
	}
	
	canvasDimensions.x = (width % 1 === 0)?	width :	Math.floor(width);
	canvasDimensions.y = (height % 1 === 0)?height:	Math.floor(height);
	camera.aspect = width/height;
	camera.updateProjectionMatrix();
	renderer.setPixelRatio(width/height);
	renderer.setSize(width,height);
	
	animate();
}


//#region [rgba(105,255,55,0.03)] Systems and Lines

/**
 * @typedef {[number,number,number, ... number]} CoordinateBuffer [x,y,z,...]
 */
/** 
 * @typedef {[number,number,number, ... number]} ColorBuffer [r,g,b, ...]
 */
/**
 * @typedef {number[]} SizeBuffer
 */
/**
 * 
 * @typedef drawSystemConnectionsInstruction
 * @property {CoordinateBuffer} coords
 * @property {ColorBuffer} colors
 * 
 */
/**
 * 
 * @typedef drawSystemPointsInstructions
 * @property {CoordinateBuffer} coords
 * @property {ColorBuffer} colors
 * @property {SizeBuffer} sizes
 */
/**
 * This array indicates which objects are done adding to the scene
 */
let hasBeenDrawn = [	//Index
	false, //Skybox			0
	false, //Galplane		1
	false, //Sectors		2
	false, //connections	3
	false //systems			4
];


/**
 * @param {drawSystemPointsInstructions} data Object containing all the necessary buffers to be given to the GPU
 */
function drawSystemPoints(data){

	//reserved scene: 4
	createSceneIfUndefined(4);
	//generate a position,size and color buffer
	//for tomorrow: https://github.com/WaldemarLehner/ED_PathMap/blob/master/src/js/drawData.js#L205
	//import the shaders
	/** @type {String} */
	let vertexShader = require("!!raw-loader!../../shader/pointVertex.glsl");
	/** @type {String} */
	let fragmentShader = require("!!raw-loader!../../shader/pointFragment.glsl");
	getTextureByURL("../src/image/canvas/systemPoint.png",onTextureLoaded);
	function onTextureLoaded(texture){
		let material = new THREE.ShaderMaterial({
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			uniforms:{
				amplitude:{value:1.0},
				color: {value: new THREE.Color(0xFFFFFF)},
				texture: {value: texture}
			},
			depthTest: false,
			transparent: true
		});
		let geometry = new THREE.BufferGeometry();
		geometry.addAttribute("position",new THREE.Float32BufferAttribute(data.coords,3));
		geometry.addAttribute("customColor",new THREE.Float32BufferAttribute(data.colors,3));
		geometry.addAttribute("size",new THREE.Float32BufferAttribute(data.sizes,1));
		let points = new THREE.Points(geometry,material);
		scenes[4].add(points);
		hasBeenDrawn[4] = true;
		indicatePreparationDoneIfReady();
		animate();
	}
}
/**
 * @param {drawSystemConnectionsInstruction} data Object containing all the necessary buffers to be given to the GPU
 */
function drawConnectionLines(data){
	//reserved scene: 3
	createSceneIfUndefined(3);
	//generate a position and color buffer
	let material = new THREE.LineBasicMaterial({
		color: 0xFFFFFF,
		vertexColors: THREE.VertexColors,
		opacity: .3,
		transparent:true
	});

	let linesGeometry = new THREE.BufferGeometry();
	linesGeometry.addAttribute("position",new THREE.Float32BufferAttribute(data.coords,3));
	linesGeometry.addAttribute("color",new THREE.Float32BufferAttribute(data.colors,3));
	let lineObject = new THREE.Line(linesGeometry,material);
	scenes[3].add(lineObject);
	hasBeenDrawn[3] = true;
	indicatePreparationDoneIfReady();
	animate();
}


//#endregion

//#region [rgba(255,100,255,0.05)] Camera
/** @param {THREE.Quaternion} rotation */
function setCameraRotation(rotation){
	if(rotation instanceof THREE.Quaternion)
		camera.quaternion.set(rotation);
}
function getCameraRotation(){
	return camera.quaternion.clone();
}

function setCameraPosition(position){
	if(position instanceof THREE.Vector3)
		camera.position.set(position);
}
function getCameraPosition(){
	return camera.position.clone();
}
//#endregion


/** @param {number} index Index in the Scene Array */
function createSceneIfUndefined(index){
	if (!(scenes[index] instanceof THREE.Scene)) {
		scenes[index] = new THREE.Scene();
	}
}
/**
 * Gets a texture, considerst the context of the script to use the appropriate tools
 * @param {String} url url relative to the worker
 * @param {Function} callback
 */
function getTextureByURL(url,callback){
	let loader = (worker.isWorker) ? new THREE.ImageBitmapLoader() : new THREE.ImageLoader();
	loader.load(url,callback);
}
/**
 * 
 * @param {number} sceneID 
 * @param {boolean} show 
 */
function showHideScene(sceneID,show){
	if(typeof sceneID !== "number")
		throw "Please pass a number as sceneID";
	if(typeof show !== "boolean")
		throw "Please pass a boolean as show";
	if(sceneID%1!==0)
		sceneID = Math.floor(sceneID);
	if(sceneID < 0)
		throw "sceneID cannot be smaller than 0";
	activeScenes[sceneID] = show;
	animate();
}

function indicatePreparationDoneIfReady(){
	hasBeenDrawn.forEach((bool)=>{
		if(!bool){
			return;
		}
	});
	//If the fn reaches here, all objects have been drawn, time to send the message
	worker.post([{ cmd: "UI", params: { loaderIDFinished: "FinishCanvasDrawing", smallText: "Finished drawing stuff onto the canvas." } }]);

}


/** This is called from animate() and will move the skybox so that there's no distortion on the skybox */
function updateSkyboxPosition(){
	if(typeof skybox === "undefined"){return;}
	let camPosition = camera.position.clone();
	skybox.position.set(camPosition.x,camPosition.y,camPosition.z);

}