/* eslint-disable no-console */



module.exports = {
	preparationWorker: preparationWorker,
	canvasWorker: canvasWorker
	
};

function preparationWorker(pathToWebWorkerScript,callback){
	callback = console.warn;
	//let worker = (typeof name === "string")? new Worker(pathToWebWorkerScript,{name:name}) :new Worker(pathToWebWorkerScript);
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
	//Override callback for now.
	callback = console.info;

	let createWorker = require("offscreen-canvas/create-worker.js");

	const canvas = document.querySelector("canvas.canvas");

	const worker = createWorker(canvas, url, callback);

	return worker;

}