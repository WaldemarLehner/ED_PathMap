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
		let system = {};
		if(typeof system !== "undefined"){
			//Element exists
			system.count++;
			if(max < system.count){
				max = system.count;
			}
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
	for(let iterator = 0;iterator < json.length-1;iterator++){
		let sys1 = json[iterator];
		let sys2 = json[iterator+1];
		let name = getConnectionName(sys1,sys2);
		let connection = connectionMap[name];
		if(typeof connection === "undefined"){
			createNewConnection(sys1,sys2);
		}else{
			connection.count++;
			if (maxVisits < connection.count){
				maxVisits = connection.count;
			}
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

function drawInstructions(json,points,lines,maxVisits){
	//An Object w/ 2 Arrays. One for systems, and one for Connections
	let instructions = {};
	instructions.points = generatePointInstructions(points,maxVisits.systems);
	instructions.lines = generateLineInstructions(json,lines,points,maxVisits.connections);
	return instructions;
}


function generatePointInstructions(obj,maxValues){
	let retArr = [];
	for(let key in obj){
		if(!obj.hasOwnProperty(key)){continue;}
		let element = obj[key];
		let coords = element.coords;
		let count = element.count;

		retArr.push({
			color: generateColorsAndSizes.generateColor(count,true,maxValues),
			size: generateColorsAndSizes.generatePointSize(count,maxValues),
			position: coords
		});

	}
	return retArr;
}
/**
 *
 *
 * @param {[]} json
 * @param {object} obj
 * @param {number} maxValues
 */
function generateLineInstructions(json,lines,points,maxValues){
	let retArr = [];
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
		
		let color = generateColorsAndSizes.generateColor(thisConnection.count,false,maxValues);
		let position = points[thisConnection.name].coords;
		retArr.push({color:color,coords:position});
		if (thisConnection.count !== nextConnection.count){
			retArr.push({color:color,coords:points[nextConnection.name].coords});
		}
		if(iterator === json.length-2){
			//Last loop.
			//Add the last connection
			let color = generateColorsAndSizes.generateColor(nextConnection);
			retArr.push(
				{color:color,coords:points[nextObject.name].coords},
				{color:color,coords:points[nextnextObject.name].coords}
			);
		}
		
	}
	return retArr;
}