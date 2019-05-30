//This is the canvas Interface. It#s the interface between the webworker and the main thread. 

/**
 *
 * @typedef {Object} canvasInterfaceInputObject
 * @property {array} logs The travel logs
 * @property {Object} systemMap An Object containing all the necessary info about the systems
 * @property {Object} connectionMap An Object containing all the necessary info about connections.
 */

/*
 *
 *
 *
 *
 *
 */


module.exports = canvasInterface;

/**
 * 
 * @param {canvasInterfaceInputObject} _data The Data object containing all the necessary data from the preparation Webworker
 */
function canvasInterface(_data){
	if(typeof _data === "undefined"){
		throw "_data needs to be an object containing an array and two objects.";
	}
	//Check if the canvasInterface has been initialized with the "new" keyword.
	//If not, return the canvasInterface with the "new" keyword -> initialize as instance.
	if(!(this instanceof canvasInterface)){
		return new canvasInterface();
	}
	//The data object contains the data given by the preparationWorker (without the instructions for the canvas Webworker). It is never modified.
	let data = _data;
	//Freeze the data so no code can modify it by accident.
	Object.freeze(data);
	//The pointers object contains data that points to a certain current value. For example the current System.
	//currentSystem points to the array index of the current system
	let pointers = {currentSystem: data.logs.length-1};
	let settings = {
		show:require("./configuration/drawParameters").canvasInterface.show
	};
	
	//#region[rgba(255,255,2,0.05)] Camera Focus Functions
	//This region has all the NOT-EXPOSED calls to manipulate the cameras position
	let camera = {

	};
	//#endregion
	//#region[rgba(255,255,255,0.1)] exposed functions
		
	//#endregion
}