/**
 * @typedef { [number, number, number, ...number] } CoordinateBuffer x,y,z ...
*/
/**
 * @typedef {[number, number, number, ...number]} ColorBuffer r,g,b ... 
 */
/**
 * @typedef {number[]} SizeBuffer
 */
/**
 *
 * @typedef drawSystemConnectionsInstruction
 * @property {CoordinateBuffer} coords
 * @property {ColorBuffer} colors
 *
 */
/**
 *
 * @typedef drawSystemPointsInstructions
 * @property {CoordinateBuffer} coords
 * @property {ColorBuffer} colors
 * @property {SizeBuffer} sizes
 */



module.exports = {
	systemMap: systemMap,
	connectionMap: connectionMap,
	drawInstructions: drawInstructions
};

function systemMap(json){
	let systems = {};
	let max = 1;
	for(let index = 0;index < json.length;index++){
		let element = json[index];
		let system = systems[json[index].name];
		if(typeof system !== "undefined"){
			//Element exists
			system.count++;
			max = overrideIfGreater(system.count,max);
		}else{
			//Create new element
			system = createNewSystem(element);
		}
		systems[system.name] = system;

	}
	return {map: systems,max: max};
	
}

function createNewSystem(el){
	return {
		name: el.name,
		count : 1,
		//divide all values by 32 because EDSM stores them as Integers. We need floating point numbers though.
		coords: {
			x: el.x / 32,
			y: el.y / 32,
			z: el.z / 32
		}
	};
}




function connectionMap(json){
	let connectionMap = {};
	let maxVisits = 1;
	for(let iterator = 0;iterator < json.length-2;iterator++){
		
		let sys = [json[iterator], json[iterator + 1]];
		let name = getConnectionName(sys[0].name,sys[1].name);
		let connection = connectionMap[name];
		//System not in list yet.
		if(typeof connection === "undefined"){
			createNewConnection(sys[0],sys[1],connectionMap);
		}else{
		//System in list already.
			connection.count++;
			maxVisits = overrideIfGreater(connection.count,maxVisits);
		}
	}
	return {map: connectionMap,max: maxVisits};
}
function createNewConnection(sys1,sys2,connectionMap){
	let name = getConnectionName(sys1.name, sys2.name);

	connectionMap[name] = {
		name: name,
		count: 1
	};

}

function overrideIfGreater(value,greaterThanThis){
	return (value > greaterThanThis) ? value : greaterThanThis;
}








/**
 *
 *
 * @param {string} name1
 * @param {string} name2
 * @returns {string} The name that describes the connection between the two given systems.
 */
function getConnectionName(name1,name2){
	let comparision = name1.toUpperCase().localeCompare(name2.toUpperCase());
	if(comparision === 1){
		return name1+":"+name2;
	}else{
		return name2+":"+name1;
	}

}

let generateColorsAndSizes = require("./generateColorsAnSizes");
/**
 * @typedef InstructionsObject
 * @property {drawSystemConnectionsInstruction} connections
 * @property {drawSystemPointsInstructions} points
 */

/**
 * 
 * @param {*[]} json 
 * @param {*} points 
 * @param {*} lines 
 * @param {number} maxVisits 
 * @returns {InstructionsObject}
 * 
 */
function drawInstructions(json,points,lines,maxVisits){
	//An Object w/ 2 Arrays. One for systems, and one for Connections

	let instructions = {};
	instructions.points = generatePointInstructions(points,maxVisits.systems);
	instructions.lines = generateLineInstructions(json,lines,points,maxVisits.connections);
	return instructions;
}

/**
 * 
 * @param {*} obj 
 * @param {number} maxValues 
 * @returns {drawSystemPointsInstructions}
 */
function generatePointInstructions(obj,maxValues){
	/**
	* @type {SizeBuffer}
	*/
	let sizeBuffer = [];
	/**
	 * @type {ColorBuffer}
	 */
	let colorBuffer = [];
	/**
	 * @type {CoordinateBuffer}
	 */
	let coordsBuffer = [];
	for(let key in obj){
		if(!obj.hasOwnProperty(key)){continue;}
		let element = obj[key];
		let coords = element.coords;
		let count = element.count;

		colorBuffer.push(generateColorsAndSizes.generateColor(count, true, maxValues));
		sizeBuffer.push(generateColorsAndSizes.generatePointSize(count, maxValues));
		coordsBuffer.push(coords.x,coords.y,coords.z);

	}
	return {
		coords: coordsBuffer,
		colors: colorBuffer,
		sizes: sizeBuffer
	};
}
/**
 *
 *
 * @param {[]} json
 * @param {object} obj
 * @param {number} maxValues
 * @returns {drawSystemConnectionsInstruction}
 */
function generateLineInstructions(json,lines,points,maxValues){
	/**
	 * @type {ColorBuffer}
	 */
	let colorBuffer = [];
	/**
	 * @type {CoordinateBuffer}
	 */
	let coordsBuffer = [];
	//let retArr = [];
	for(let iterator = 0;iterator<json.length-2; iterator++){
		/*
		*	For Each Connection, check if next connection has the same visitCount.
		*	If not, create a new point first with the next connections color. This is to ensure that there is no color change inside a connection
		*/
		let thisObject = json[iterator],nextObject = json[iterator+1],nextnextObject = json[iterator+2];
		//Check if this connection and the next connection have the same count of travels. If yes, there is no need to add another vertex inbetween.
		let thisConnection = lines[getConnectionName(thisObject.name,nextObject.name)];
		let nextConnection = lines[getConnectionName(nextObject.name,nextnextObject.name)];
		//The next connection will have the same color → No need to add a vertex inbetween. Only add the first Point of the connection
		if(isUndef(thisConnection) || isUndef(nextConnection)){
			//Connection does not exist. Skip
			continue;
		}
		let color = generateColorsAndSizes.generateColor(thisConnection.count,false,maxValues);
		let position = points[thisObject.name].coords;
		//retArr.push({color:color,coords:position});
		colorBuffer.push(color);
		coordsBuffer.push(coordsAsArray(position));
		if (thisConnection.count !== nextConnection.count){
			let color = generateColorsAndSizes.generateColor(nextConnection.count,false,maxValues);
			//retArr.push({color:color,coords:points[nextObject.name].coords});
			colorBuffer.push(color);
			let coords = points[nextObject.name].coords;
			coordsBuffer.push(coordsAsArray(coords));
		}
		if(iterator === json.length-2){
			//Last loop.
			//Add the last connection
			let color = generateColorsAndSizes.generateColor(nextConnection);
			/*retArr.push(
				{color:color,coords:points[nextObject.name].coords},
				{color:color,coords:points[nextnextObject.name].coords}
			);*/
			colorBuffer.push(color,color); //Insert 2 colors into the buffer, as we insert 2 Vertices
			coordsBuffer.push(coordsAsArray(points[nextObject.name].coords),coordsAsArray(points[nextnextObject.name].coords));
		}
		
	}
	return {coords: coordsBuffer,colors: colorBuffer};
}

/**
 * 
 * @param {object} _coords 
 * @returns {[number,number,number]}
 */
function coordsAsArray(_coords){
	return [_coords.x,_coords.y,_coords.z];
}

function isUndef(el){
	return typeof el === "undefined";
}