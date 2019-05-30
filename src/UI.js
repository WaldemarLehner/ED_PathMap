/* eslint-disable no-console */
"use strict";
module.exports = {
	updateBigText: updateBigText,
	updateSmallText: updateSmallText,
	update: update,
	updateLoadingBar: updateLoadingBar,
	loadingOverlay: loadingOverlay
};
const jQuery = require("jquery");
let isEasterEggActive = (Math.random()<0.1)?true:false; //The value to the right of < is the percentage (range: 0 to 1)
/**
 *
 * Writes either a given string or a random text to the big loading text 
 * @param {string|undefined} stringOrUndefined String to display. Dont pass anything to chose a random one.
 */
function  updateBigText(stringOrUndefined) {
	const jokeTexts = require("./configuration/RandomLoadingTexts");
	let t1 = jQuery("#loaderTextBig");
	//Set the big text to passed text if any has been passed. If no text has been passed, set to one of the
	//Default texts if the easterEgg is of. If it is on, set to one of the easterEgg texts
	/*let text = (typeof stringOrUndefined === "string") ? 
		stringOrUndefined : 
		(isEasterEggActive) ?	jokeTexts.easterEgg[Math.floor(Math.random() * jokeTexts.length)] :
			jokeTexts.default[Math.floor(Math.random() * jokeTexts.length)];
*/
	let text;
	if(typeof stringOrUndefined === "string"){
		text = stringOrUndefined;
	}else{
		let textsPool = (isEasterEggActive) ? jokeTexts.easterEgg : jokeTexts.default;
		text = textsPool[Math.floor(Math.random()*textsPool.length)];
	}
	t1.text(text);
}


/** 
 * Updates the Name, Index and Date of a Log Entry to be seen in the UI.
 */
//TODO!!! Uncomment when the time is right ;)
function update(){}
/*

function update () {
	const canvasInterface = require("./canvasInterface");
	let count = canvasInterface.getFocusIndex();
	let data = canvasInterface.getSystemInFocus();
	jQuery("#nav_sysname").text(data.name);
	jQuery("#nav_sysdate").text(data.date);
	jQuery("#nav_systemid").text(count.toString()+" / "+(canvasInterface.getLogList().length-1).toString());
}
*/

/**
 *
 * Writes a given string to the small loading text. When given a value that is not a string, nothing will be displayed.
 * @param {string} string String to display. 
 */
function updateSmallText(string){
	let t2 = jQuery("#loaderTextSmall");
	let text;
	if(typeof string === "string"){
		text = string;
	}else{
		text = "";
		console.warn("No String has been passed to UI.updateText2");
	}
	t2.text(text);
}

/**
 * Gives the ID of each loading event.
 * @readonly
 * @enum {number}
 */
const loadingBarEvents = Object.freeze({	//Chunks on the loading bar
	XHRFinished: 0,			//2
	StartProcessor: 1,		//1
	StartCanvasWorker: 2,	//1
	FinishProcessing: 3,	//4
	FinishImageLoading: 4,	//3
	FinishCanvasDrawing: 5	//3
});							//14 SUM
/** @type {boolean[]} */
const loadingBarEventsFinished = new Array(6).fill(false);
const loadingBarEventsPercentage = [
	2/14,1/14,1/14,4/14,3/14,3/14
];
/**
 * 
 * @param {loadingBarEvents} eventName 
 */
function updateLoadingBar(eventName){
	if(typeof loadingBarEvents[eventName] === "undefined")
		throw "Eventname does not exist.";
	if(!loadingBarEventsFinished[loadingBarEvents[eventName]]){
		loadingBarEventsFinished[loadingBarEvents[eventName]] = true;
		updateLoadingBarLen();
		updateBigText();
	}

}
function updateLoadingBarLen(){
	let percentageSum = 0;
	loadingBarEventsFinished.forEach((value,index)=>{
		if(value){
			percentageSum += loadingBarEventsPercentage[index];
		}
	});
	jQuery("#loadingProgressIndicator").width(String(percentageSum*100)+"%");
	if(percentageSum === 1){ //100%, hide
		jQuery("#loadingProgressIndicator").fadeOut(200);
		loadingOverlay(false);
	}
}

/**
 * 
 * @param {boolean} show Should the overlay be shown or hidden?
 */
function loadingOverlay(show){
	let overlay = jQuery("div.loadingScreen");
	if(show){
		if(!overlay.hasClass("active")){
			overlay.addClass("active");
		}
	}else{
		if(overlay.hasClass("active")){
			overlay.removeClass("active");
		}
	}
}