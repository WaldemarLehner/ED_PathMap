/*	Written by Waldemar Lehner (wowa.lehner@gmail.com)
*		https://github.com/WaldemarLehner
*		Part of the "EDPathMap" project.
*
*		This js file sets up an easy-to-use interface for the three.js context that
* 	draws the players travel history (as generated in drawData.js);
*  	It's possible to add bookmarks and similar to the UI, focus onto a certain
*		coordinate and so on.
*		In addition this file contains helper classes that are required for the use
*		 of the Interface.
*/
PATHMAP = {};
//#region Interface
PATHMAP.Interface = function(){
	if(!(this instanceof PATHMAP.Interface)){
		return new PATHMAP.Interface();
	}
	//#region API
		//#region GET
	this.getCamera = function(){
		return _camera;
	};
	this.getScene = function(index){
		return _scenes[index];
	};
	this.getMarkers = function(){
		return _markers;
	};
	this.getControls = function(){
		return _controls;
	};
		//#endregion
		//#region SET
	this.addMarker = function(marker){
		if(!(marker instanceof PATHMAP.Marker)){
			throw "Expected a PATHMAP.Marker object.";
		}
		//TODO: add marker logic
	};
	this.focusCamera = function(vPos,Distance,eEuler){
		let _pos,dist,euler;
		if(vPos instanceof THREE.Vector3){
			_pos = vPos;
		}
		else{
			throw "first parameter needs to be the position. This has to be a new THREE.Vector3. This parameter is is not optional.";
		}
		if(Distance instanceof number){
			if(Distance < 0){
				dist = -Distance;
				console.warn("Second parameter is negative. Multiplying by -1");
			}
			else{
				dist = Distance;
			}
		}
		else{
			console.warn("Second parameter is not a number. Using a default value of 50 for the distance.");
		}
		if(eEuler instanceof THREE.Euler){
			euler = eEuler;
			if(euler.z !== 0){
				euler.z = 0;
				console.warn("z component of Euler angle will not be used.");
			}
		}else{
			eEuler = null;
		}
		_controls.focusAt(_pos,dist,euler);
	};

		//#endregion
	//#endregion
	//#region private vars
	var _controls,_camera;
	var _scenes = [];
	var _markers = [];
	//#endregion
};

PATHMAP.Marker = function(vector3,indexOrstring){
	if(!(vector3 instanceof THREE.Vector3)){
		throw "first parameter needs to be instance of THREE.Vector3";
	}
	this.srcName = undefined;
	this.position = vector3;
	if(typeof indexOrstring === "number"){
		// index definitions (indexArray)
		let iA = [
			"bookmark",					// 0
			"bookmark_aqua",
			"bookmark_green",
			"bookmark_lime",
			"bookmark_peach",
			"bookmark_pink",		// 5
			"bookmark_red",
			"bookmark_violet",
			"bookmark_white",
			"bookmark_yellow",
			"communitygoal",		// 10
			"engineer",
			"expedition_start",
			"expedition_waypoint",
			"expedition_finish",
			"expedition_member",// 15
			"mission",
			"ship",
			"friends",
			"wing"							// 19
		];
		if(indexOrstring < 0){
			console.warn("Second parameter, if number, has to be positive. Setting to 0");
			indexOrstring = 0;
		}
		if(indexOrstring > iA.length-1){
			console.log("Given index is out of bounds. Clamping to biggest possible value: "+iA.length-1);
			indexOrstring = iA.length-1;
		}
		this.srcName = iA[indexOrstring];


	}
	else if(typeof indexOrstring === "string"){
		this.srcName = indexOrstring;
	}
};

//#endregion
