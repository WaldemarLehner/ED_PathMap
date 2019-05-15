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
	const validate = require("./validate");
	/**
	 * Collects all the errors that happen when passing the arguments.
	 */
	let errorList = [];
	/*
	if(!(initArguments.camera instanceof THREE.Camera)){
	}*/
	if(!validate.one(initArguments.camera,THREE.Camera,true,true)){
		createError(initArguments.camera, "camera needs to be typeof THREE.Camera.", errorList);
	}

	if(Array.isArray(initArguments.scenes)){
		if (initArguments.scenes.length === 0) {
			createError(initArguments.scenes, "scenes Array needs to be longer than one.", errorList);
		}
		else if (!validate.multiple(initArguments.scenes, Array(initArguments.scenes.length).fill(THREE.Scene), Array(initArguments.scenes.length).fill(true), Array(initArguments.scenes.length).fill(true))){
			createError(initArguments.scenes, "scenes are not all typeof THREE.Scene", errorList);
		}
	}else{
		createError(initArguments.scenes, "scenes needs to be an Array.", errorList);
	}


	if(!validate.one(initArguments.controls,EDControls,true,true)){
		createError(initArguments.controls, "controls needs to be typeof EDControls", errorList);
	}


	//TODO!! Create Checks for linesref, pointsref, logList, sysList ALSO... CAN I CHANGE THE STRUCTURE?



};
function createError(object, errmsg,errorList) {
	errorList.push([object, errmsg]);
}


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