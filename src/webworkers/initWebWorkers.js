/* eslint-disable no-console */



module.exports = {
	preparationWorker: preparationWorker,
	canvasWorker: canvasWorker
	
};

function preparationWorker(pathToWebWorkerScript,callback){

	let worker = new require("worker-loader!./prepareData/main.js")();
	worker.addEventListener("message",function(msg){
		callback(msg);
	},false);
	worker.addEventListener("error",function(msg){
		callback([{
			cmd:"error",
			params: msg
		}]);
	},false);
	return worker;
}

function canvasWorker(url,callback){


	let createWorker = require("offscreen-canvas/create-worker.js");

	const canvas = document.querySelector("canvas.canvas");

	const worker = createWorker(canvas, url, callback);

	return worker;

}