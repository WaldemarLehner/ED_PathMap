//This is the Webworker / Script (on envs that dont support canvas webworkers) that interfaces with the THREE Context.
let insideWorker = require("offscreen-canvas/inside-worker");

const worker = insideWorker(msg => {
	/*
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
		
	},1000);*/
	let data = msg.data;
	//If the passed data is not empty...
	if(typeof data !== "undefined"){
		let command = getCommandFromCMDString(data.cmd);
		command(data.params);
	}
});
/**
 * 
 * @param {string} string 
 */
function getCommandFromCMDString(string){
	let regexp = /[a-zA-z]+/;
	let strings = string.split(regexp);
	try{
		return eval("API."+strings.join("."));	
	}catch(err){
		//Error thrown when the API point does not exist
		returnError(err);
	}

}


function returnError(dataToReturn){

}