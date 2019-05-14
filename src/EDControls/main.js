"use strict";
const THREE = require("three");
const validate = require("../validate");



/**
 *This module handles the input to the THREE canvas and gives the commands to manipulate the camera
 * @param {THREE.Camera} camera The Camera used in the THREE Scene
 * @param {THREE.Scene[]} scenes The Scense used in the THREE canvas
 */
module.exports = (camera,scenes) => {
//If Input is not valid. Display all errors
	validate.multiple([camera,scenes],[THREE.Camera,THREE.Scene],[true,true]);
	this.keys = require("../configuration/keyBoardInputKeyCodes");
	const configuration = require("./configuration");
	let currentValues = require("./currentValues");
	this.API = {
		camera:{
			get: ()=>{return camera;},
			focus: (focusPosition,distance,angle,timeToAnimate)=>{
				validate.multiple(
					[focusPosition,distance,angle,timeToAnimate],
					[THREE.Vector3,"number",THREE.Euler,"number"],
					[true,false,true,false],
					false);
				
				
			}
		}
	};





};