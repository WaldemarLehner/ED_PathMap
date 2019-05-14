let definitions = require("../configuration/drawParameters");
let chroma = require("chroma-js");
module.exports = {generateColor:generateColor,generatePointSize:generatePointSize};


function generateColor(value,isPoint,maxVisits){
	let minmax = [];
	let def = (isPoint) ? definitions.systems.color : definitions.connections.color;
	minmax[0] = (def.useMaxValueFromLogsInstead) ? maxVisits : def.maxVal;
	minmax[1] = def.maxVal;
	let color = chroma.scale(def.colorGradient).mode("lab").domain(minmax[0],minmax[1]);
	return color(value).num();
}

function generatePointSize(value,maxVisits){
	let def = definitions.systems.size;
	
	if(def.useSizeMapperInstead){
		return getSizeMapperSize((def.sizeMapper.useAbsoluteValues)?value:value/maxVisits);
	}else{
		let min = def.minSize,max = def.maxSize;
		return Interpolate(value,[0,maxVisits],[min,max]);
		
	}
}

/**
 *
 *
 * @param {number} expects a number between 0 and 1 if useAbsoluteValues is off and a value > 0 if it is on.
 */
function getSizeMapperSize(value){
	let sizeDef = definitions.systems.size.sizeMapper.sizeValues;
	let index = 0;
	let brokeOut = false;
	for(index;index < sizeDef.length;index++){
		if(sizeDef[index][0] >= value){
			brokeOut = true;
			break;
		}
	}
	//Extremas
	if(!brokeOut){
		return sizeDef[index][1];
	}
	if(index === 0){
		return sizeDef[0][1];
	}
	//Interpolate 
	return Interpolate(value, [sizeDef[index - 1][0], sizeDef[index][0]], [sizeDef[index - 1][1], sizeDef[index][1]]);
}

/**
 *Interpolate value between set1 and apply the value onto set2.
 * @param {number} value
 * @param {number[]} set1 -> consists of 2 numbers
 * @param {number[]} set2 -> consists of 2 numbers
 */
function Interpolate(value,set1,set2){
	if(value <= set1[0]){return set2[0];}
	if(value >= set1[1]){return set2[1];}
	//Values position between the two values in set1 (0 -> at index 0 || 1 -> at index 1)
	let valpos = (value-set1[0])/(set1[1]-set1[0]);
	return set2[0]+(set2[1]-set2[0])*valpos;
}