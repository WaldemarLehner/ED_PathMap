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
	

});
/**
 * 
 * @param {string} string 
 */

