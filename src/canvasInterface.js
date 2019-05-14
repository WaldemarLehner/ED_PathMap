"use strict";
const THREE = require("three");
const jQuery = require("jquery");
var EDControls = require("./EDControls");
/**
 *
 *
 * @param {object} initArguments The Argument Wrapper
 * @param {"THREE.camera"} initArguments.camera The Scene Camera
 * @param {"THREE.Scene[]"} initArguments.scenes All the scenes passed as an array
 * @param {"THREE.Control"} initArguments.controls The Input Controller Object
 * @param {object} initArguments.linesref Container with all lines
 * @param {object} initArguments.pointsref Container with all points
 * @param {object} initArguments.logList Container with all logs
 * @param {object} initArguments.sysList Container with all necessary systems
 */
let validateInput = (initArguments) => {
	/**
	 * Collects all the errors that happen when passing the arguments.
	 */
	let errorList = [];
	
	if(!(initArguments.camera instanceof THREE.Camera)){
		createError(initArguments.camera,"camera needs to be typeof THREE.Camera.");
	}


	if(!(Array.isArray(initArguments.scenes))){
		createError(initArguments.scenes,"scenes needs to be an Array.");
	}else{
		if(initArguments.scenes.length === 0){
			createError(initArguments.scenes,"scenes Array needs to be longer than one.");
		}
		else{
			initArguments.scenes.forEach((val,index) => {
				if(!(val instanceof THREE.Scene)){
					createError(initArguments.scenes,"The value of scenes["+index+"] needs to be typeof THREE.Scene");
				}
			});
		}
	}


	if(!(initArguments.controls instanceof EDControls)){
		createError(initArguments.controls,"controls needs to be typeof EDControls");
	}


	//TODO!! Create Checks for linesref, pointsref, logList, sysList


	function createError(object,errmsg){
		errorList.push([object,errmsg]);
	}
};


/**
 *
 *
 * @param {object} initArguments The Argument Wrapper
 * @param {"THREE.camera"} initArguments.camera The Scene Camera
 * @param {"THREE.Scene[]"} initArguments.scenes All the scenes passed as an array
 * @param {"THREE.Control"} initArguments.controls The Input Controller Object
 * @param {object} initArguments.linesref Container with all lines
 * @param {object} initArguments.pointsref Container with all points
 * @param {object} initArguments.logList Container with all logs
 * @param {object} initArguments.sysList Container with all necessary systems
 */
module.exports = (initArguments) => {
	if(!validateInput(initArguments)){
		//TODO!
	}
};