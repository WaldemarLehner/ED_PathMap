/* eslint-disable no-console */



module.exports = {
	
	canvasWorker: canvasWorker
	
};



function canvasWorker(url,callback){
	//Override callback for now.
	callback = console.info;

	let createWorker = require("offscreen-canvas/create-worker.js");

	const canvas = document.querySelector("canvas.canvas");

	const worker = createWorker(canvas, url, callback);

	return worker;

}