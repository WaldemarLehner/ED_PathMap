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
/**
 * @type {THREE.Scene[]} 
 */
let scenes = [];
/**
 * @type {THREE.PerspectiveCamera}
 */
let camera;
/**
 * @type {THREE.WebGLRenderer}
 */
let renderer;











const worker = insideWorker(msg => {
	
	let data = msg.data;
	if(typeof data.canvas === "object"){
		
		canvas = data.canvas;
		canvasDimensions = {
			x: data.canvas.width,
			y: data.canvas.height
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
	scenes.forEach((scene)=>{
		renderer.render(scene,camera);
		renderer.autoClear = false;
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
	let strings = string.split(regexp);
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


//#region [rgba(255,255,0,0.02)]
//eslint is wrong here. It is being called using eval.
// eslint-disable-next-line no-unused-vars
const API = {
	get: {
		skybox:{
			isHidden: undefined//TODO
		},
		galplane:{
			isHidden: undefined//TODO
		},
		sectors: {
			isHidden: undefined//TODO
		},
		scenes: {
			isSceneUsed: undefined, //takes a num as arg, checks if it exists
			allOccupiedScenes: undefined //returns an bool array, each index is the corresponsing scene
		},
		camera: {
			position: getCameraPosition,
			rotation: getCameraRotation
		}
	},
	set: {
		skybox:{
			init: undefined, //TODO
			hide: undefined,
			show: undefined
		},
		galplane:{
			init: undefined,
			hide: undefined,
			show: undefined
		},
		sectors:{
			init: undefined,
			hide: undefined,
			show: undefined
		},
		scenes:{
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


//#region [rgba(255,255,55,0.03)] Systems and Lines

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