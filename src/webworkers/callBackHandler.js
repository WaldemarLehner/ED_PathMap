/* eslint-disable no-console */
//This module handles the callbacks from 

/*
*	Command Structure:
*	cmd: command name. The command to execure
*	params: the parameters
*
*/

/* CMD LIST (cmd | params)
* setPreparedData | MessageEvent
* logError | errObj
* 
*/

module.exports = {
	addWorkers: (prepWorker,canvasWorker) => {
		Webworkers.preparationWebworker = prepWorker;
		Webworkers.canvasWebworker = canvasWorker;
	},
	callback: MessageFromWorker
};

var UI = require("../UI");
let Webworkers = {
	preparationWebworker: undefined,
	canvasWebworker: undefined
};
/** @param {MessageEvent} MessageEvent */
function MessageFromWorker(MessageEvent){
	let arrayOfCommands = MessageEvent.data;
	validateArray(arrayOfCommands);
	arrayOfCommands.forEach((el)=>{
		let cmd = getCommandByString(el.cmd);
		if(typeof cmd === "function"){
			cmd(el.params);
		}else{
			console.error("Could not find the command.", el);
		}
	});
}

/**
 * @param {Array} arr
 */
function validateArray(arr){
	if(!Array.isArray(arr)){
		throw "This function expects an Array of Objects {cmd: string, param: any}";
	}
	arr.forEach((el)=>{
		if(typeof el.cmd !== "string"){
			throw "The Command needs to be typeof String";
		} 
	});
	return true;
}

function getCommandByString(string){
	let commands = {
		setPreparedData : setPreparedData,
		error: logError,
		UI: userInterface,
		log: log
	};
	return commands[string];
}

function setPreparedData(data){
	//Send the prepared data over to the canvas Worker
	//console.log("setPreparedDate has been called with:",data);
	Webworkers.canvasWebworker.post(
		[
			{ cmd:"set.drawSystemPoints", params: data.drawInstructions.points },
			{ cmd:"set.drawConnectionLines", params: data.drawInstructions.lines }
		]
	);
}

function logError(data){
	console.error("One of the Webworkers sent this Error:",data);
}

/**
 * @typedef userInterfaceData
 * @property {number | void} loaderIDFinished The ID of the task that has been finished
 * @property {string | void} smallText The small text to be displayed next
 * 
 */

/**
 * 
 * @param {userInterfaceData} data 
 */
function userInterface(data){
	console.log(data);
	if(typeof data.loaderIDFinished === "string"){
		UI.updateLoadingBar(data.loaderIDFinished);
	}else{console.error(data);}
	if(typeof data.smallText === "string"){
		UI.updateSmallText(data.smallText);
	} else { console.error(data); }
}

function log(data){
	console.log(data);
}