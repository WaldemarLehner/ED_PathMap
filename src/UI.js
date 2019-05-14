/* eslint-disable no-console */
"use strict";
const jQuery = require("jquery");


module.exports = {
	updateBigText: updateBigText,
	updateSmallText: updateSmallText,
	update: update
};


/**
 *
 * Writes either a given string or a random text to the big loading text 
 * @param {string|undefined} stringOrUndefined String to display. Dont pass anything to chose a random one.
 */
function  updateBigText(stringOrUndefined) {
	const jokeTexts = require("./configuration/RandomLoadingTexts");
	let t1 = jQuery("#loader_text_big");
	let text = (typeof stringOrUndefined === "string") ? 
		stringOrUndefined : 
		jokeTexts[Math.floor(Math.random()*jokeTexts.length)];
	t1.text(text);
}


/** 
 * Updates the Name, Index and Date of a Log Entry to be seen in the UI.
 */
function update () {
	const canvasInterface = require("./canvasInterface");
	let count = canvasInterface.getFocusIndex();
	let data = canvasInterface.getSystemInFocus();
	jQuery("#nav_sysname").text(data.name);
	jQuery("#nav_sysdate").text(data.date);
	jQuery("#nav_systemid").text(count.toString()+" / "+(canvasInterface.getLogList().length-1).toString());
}


/**
 *
 * Writes a given string to the small loading text. When given a value that is not a string, nothing will be displayed.
 * @param {string} string String to display. 
 */
function updateSmallText(string){
	let t2 = jQuery("#loader_text_small");
	let text;
	if(typeof string === "string"){
		text = string;
	}else{
		text = "";
		console.warn("No String has been passed to UI.updateText2");
	}
	t2.text(text);
}