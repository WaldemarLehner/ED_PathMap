//This is the Webworker / Script (on envs that dont support canvas webworkers) that interfaces with the THREE Context.
let insideWorker = require("offscreen-canvas/inside-worker");

const worker = insideWorker(msg => {
	
	if(msg.data.canvas){
		worker.post("canvas found");
	}else{
		worker.post("canvas not found");
	}
	if(worker.isWorker){
		worker.post("this is a worker");
	}else{
		worker.post("this is not a worker");
	}
	setInterval(function(){
		worker.post("1s passed");
		
	},1000);
	return;
	let data = msg.data;
	//If the passed data is not empty...
	if(typeof data !== "undefined"){
		let command = getCommandFromCMDString(data.cmd);
		if(typeof command === "function"){
			command(data.params);
		}
	}
});
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
			position: undefined,
			rotation: undefined
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
			position: undefined,
			rotation: undefined,
			update: undefined //when the view changes (resizing for example), the camera's projection matrix needs to be updated.
		}
	}
};