//This file will probably be executed by a webworker in the background.



const date = require("./dateOperations");


self.addEventListener("message",function(msg){
	let retData = filterData(msg.data.json, msg.data.url);
	let retObj = {
		cmd: "setPreparedData",
		params: retData
	};
	self.postMessage([retObj]);	
	close();
});



/**
 *
 *
 * @param {Array} jsonData An Array that represents the players entire travel log. 
 */
function filterData(jsonData,url){
	const generate = require("./generateF");
	if(!validateJSON(jsonData)){throw new Error("Passed Logs have an unexpected structure.");}
	let indices = date.getIndexDateBounds(jsonData,date.getDateLimits(url));
	jsonData = removeDatesOutOfBounds(jsonData,indices);
	
	//An Object holdings all Systems with coords, name and amount of visits
	let SystemMap = generate.systemMap(jsonData);
	//An Object holding all connections with name and amount of visits
	let ConnectionMap = generate.connectionMap(jsonData);
	let maxValues = {systems: SystemMap.max,connections: ConnectionMap.max};
	SystemMap = SystemMap.map;
	ConnectionMap = ConnectionMap.map;
	//This will be used to draw the actual data onto the THREE canvas. 
	//It has two objects, "systems" and "connections" and is fed to
	//the CanvasInterface to draw the points.
	let drawInstructions = generate.drawInstructions(jsonData,SystemMap,ConnectionMap,maxValues);
	let data = {
		logs: jsonData,
		maps: {
			systems: SystemMap,
			connections: ConnectionMap
		},
		drawInstructions: drawInstructions
	};
	return data;
}


/**
 * Returns the Array without the data that is not looked at.
 *
 * @param {Array} array
 * @param {number[]} indices
 * @returns {Array}
 */
function removeDatesOutOfBounds(array,indices){
	return array.slice(indices[0],indices[1]);
}


function validateJSON(json){
	checkIfJSONIsUndefinedOrNoObject(json);
	if(isObjEmpty(json)){
		throw new TypeError("An empty object has been passed");
	}
	let isValid = true;
	json.forEach(element => {
		if(!isElementValid(element)){
			isValid = false;
		}
	});
	return isValid;
}

function checkIfJSONIsUndefinedOrNoObject(json){
	if (typeof json === "undefined") {
		throw new TypeError("No argument has been passed. This method needs the logs as object to be passed.");
	}
	if (typeof json !== "object") {
		throw new TypeError("Passed argument needs to be typeof object. An object that represents an entry from the logs.");
	}
}

function isElementValid(json){
	checkIfJSONIsUndefinedOrNoObject(json);
	let retval = true;
	if (!isNum([json.x, json.y, json.z]) || typeof json.name !== "string") {
		retval = false;
	}

	if(typeof json.dateVisited !== "string"){
		retval = false;
	} else if (!isTimeInRightFormat(json.dateVisited)){
		retval = false;
	}
	return retval;
}
/**

 * @param {string} time
 */
function isTimeInRightFormat(time){
	if(typeof time !== "string"){
		return false;
	}
	//from https://gist.github.com/x-strong/5378739
	let regexp = /^(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)-02-29)\s([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
	return regexp.test(time);
}

function isNum(num){
	if(Array.isArray(num)){
		let areAllNums = true;
		num.forEach(val=>{
			if(typeof val !== "number" || isNaN(val)){
				areAllNums = false;
			}
		});
		return areAllNums;
	}
	return typeof num === "number" && !isNaN(num);
}

function isObjEmpty(obj) {
	for (var key in obj) {
		if (obj.hasOwnProperty(key))
			return false;
	}
	return true;
}