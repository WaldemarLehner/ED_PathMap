const moment = require("moment");
const jQuery = require("jquery");


module.exports = {
	getDateLimits: getDateLimits,
	getIndexDateBounds: getIndexDateBounds
};


/**
 * @exports [number,number]
 */
function getDateLimits(){
	let url = window.url;
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
	jQuery("#check_limit_selection > input").prop("checked",true);
	jQuery("#daterange").removeClass("hidden");
	let daterange_txt = (moment(dates[0]).format("YYYY-MM-DD"))+" - "(moment(dates[0]).format("YYYY-MM-DD"));
	jQuery("#daterange").val(daterange_txt);
	if(moment(dates[0]).unix()>moment(dates[1])){
		dates = dates.reverse();
		console.warn("First date was greater than last date. Reversing order.");
	}
	
	return [moment(dates[0]).unix,moment(dates[1]).unix];

}

function getIndexDateBounds(data,limits){

	
	//Get Lower Bound
	
	let retArr = [].push(execWhileLoop(true),execWhileLoop(false));

	return retArr;
//TODO: is this correct?
	function execWhileLoop(lookForBiggerThan){
		let leftBound = 0;
		let index = 0;
		let rightBound = data.length-1;
		while(leftBound >= rightBound){
			index = Math.floor((rightBound-leftBound)/2);
			if(moment(data[index].dateVisited).unix() < limits[1]){
				rightBound = (lookForBiggerThan) ? rightBound : index;
			}else{
				leftBound = (lookForBiggerThan) ? index : leftBound;
			}
		}
	}
}