const jQuery = require("jquery");
const date = require("./dateOperations");

const __DATA__ = require("../configuration/__DATASOURCE__");
const UI = require("../UI");
let getURLForLogs = () => {
	return (typeof __DATA__.api.logs === "undefined") ? __DATA__.default+"src/data/logs.json" : __DATA__.api.logs;
};


jQuery.ajax({
	url: getURLForLogs(),
	error: () => {throw "Failed to get the Travel History from EDSM. Please submit an Issue on Github";},
	success: data => {
		UI.updateBigText();
		UI.updateSmallText("Processing travel history");
		filterData(data);
	}
});


/**
 *
 *
 * @param {Array} jsonData An Array that represents the players entire travel log. 
 */
function filterData(jsonData){
	const generate = require("./generateF");
	
	let indices = date.getIndexDateBounds(jsonData,date.getDateLimits());
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