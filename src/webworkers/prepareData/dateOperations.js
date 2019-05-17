const moment = require("moment");
const jQuery = require("jquery");


module.exports = {
	getDateLimits: getDateLimits,
	getIndexDateBounds: getIndexDateBounds
};


/**
 * @exports [number,number]
 */
function getDateLimits(url){
	
	validateURL(url);
	url = url.split("?",2);
	if(url.length === 1){
		// No Date limiters
		return false;
	}
	let params = url[1].substring(url[1].lastIndexOf("[DATE]")+6,url[1].lastIndexOf("[/DATE]"));
	let dates = params.split(";",2);
	if(dates.length !== 2){
		console.error("URL is set up incorrect. Ignoring filtering by date.");
		return false;
	}
	if (isTimeAGreaterThanTimeB(dates[0],dates[1])){
		
		dates = dates.reverse();
		console.warn("First date was greater than last date. Reversing order.");
	}
	addDateLimitsToSettingsUI(dates);
	let retArr = [moment.unix(dates[0]).unix(), moment.unix(dates[1]).unix()];
	console.log(retArr);
	return retArr;

}
function addDateLimitsToSettingsUI(dates){
	/*
	jQuery("#check_limit_selection > input").prop("checked", true);
	jQuery("#daterange").removeClass("hidden");
	let daterange_txt = (moment(dates[0]).format("YYYY-MM-DD")) + " - "(moment(dates[0]).format("YYYY-MM-DD"));
	jQuery("#daterange").val(daterange_txt);
	*/
	self.postMessage([{
		cmd:"UI",
		params:dates
	}]);
}


function getIndexDateBounds(data,limits){
	//Get Lower Bound
	let retArr = getBounds(data, limits);
	return retArr;
}

function validateURL(url){
	if (typeof url !== "string") {
		throw new TypeError("Given URL is not typeof string");
	}
	if (url.length === 0) {
		throw new Error("Given URL string is 0 long.");
	}
}

function isTimeAGreaterThanTimeB(time1,time2){
	return (time1.valueOf() > time2.valueOf()) ? true : false;	
}

function getBounds(data,limits) {
	let bounds = [];
	for(let i = 0;i<data.length-1;i++){
		let time = moment(data[i].dateVisited).unix();
		//Look for left bound. If true. Left bound found.
		bounds = addToBounds(i,bounds,time,limits);
	}
	return bounds;
}

function addToBounds(i,bounds,time,limits){
	if (time >= limits[0])
		bounds.push(i);

	if (time >= limits[1])
		bounds.push((i === 0) ? 0 : i - 1);

	return bounds;
}

