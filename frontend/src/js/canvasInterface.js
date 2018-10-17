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
PATHMAP.Interface = function(camera,scenes,controls,linesref,pointsref){
	if(!(camera instanceof THREE.PerspectiveCamera || camera instanceof THREE.OrthographicCamera)){
		throw "First paremeter needs to a THREE.js camera.";
	}
	if(!Array.isArray(scenes)){
		throw "Second parameter needs to be a an array of all scenes";
	}
	if(!(controls instanceof THREE.EDControls)){
		throw "Third paremeter needs to be typeof THREE.EDControls";
	}
	if(!(this instanceof PATHMAP.Interface)){
		return new PATHMAP.Interface(camera,scenes,controls);
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
	this.addMarker = function(vPos,marker,returnMarker){
		if(!(marker instanceof PATHMAP.Marker)){
			throw "Expected a PATHMAP.Marker object as 2nd argument.";
		}
		if(!(vPos instanceof THREE.Vector3)){
			throw "Expected a THREE.Vector3 object as 1st argument.";
		}
		let retMarker = (typeof returnMarker === "boolean") ? returnMarker : false;
		let markerObj = new THREE.Sprite(getMarkerMaterial(marker.srcName));
		markerObj.position.set(-vPos.x,vPos.y,vPos.z);
		markerObj.center.y = 0;
		let sizeDivider = 20;
		markerObj.scale.set(1/sizeDivider,1.2/sizeDivider,1);
		_markers.push(markerObj);
		_scenes[2].add(markerObj);
		//_markers.push(markerObj);
		if(retMarker){
			return markerObj;
		}else{
			return this;
		}
	};
	this.focusCamera = function(vPos,Distance,eEuler,time){
		let _pos,dist,euler;
		if(vPos instanceof THREE.Vector3){
			_pos = vPos;
			_pos.x *= -1;
		}
		else{
			throw "first parameter needs to be the position. This has to be a new THREE.Vector3. This parameter is is not optional.";
		}
		if(typeof Distance === "number"){
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
		_controls.focusAt(_pos,dist,euler,time);
	};
	this.showSystemDots = function(bool){
		if(typeof bool !== "boolean"){
			throw "Given argument is not a boolean value.";
		}
		for(let sector in pointsref){
			if(!pointsref.hasOwnProperty(sector)){
				continue;
			}
			pointsref[sector].visible = bool;
		}
		return _this;
	};
	this.showSystemLines = function(bool){
		if(typeof bool !== "boolean"){
			throw "Given argument is not a boolean value.";
		}
		for(let sector in linesref){
			if(!linesref.hasOwnProperty(sector)){
				continue;
			}
			linesref[sector].userData.lockVisibility = !bool;
			linesref[sector].visible = bool;
		}
		return _this;
	};
		//#endregion
		//#region private Functions
		function getMarkerMaterial(materialName){
			let spriteMap = new THREE.TextureLoader().load("src/img/ui/markers/"+materialName+".png");
			let mat = new THREE.SpriteMaterial({map:spriteMap,color:0xFFFFFF});
			mat.sizeAttenuation = false;
			return mat;
		}
		//#endregion
	//#endregion
	//#region private vars
	var _controls = controls;
	var _camera = camera;
	var _scenes = scenes;
	var _markers = [];
	var _pointsRef = {};
	var _linesRef = {};
	var _this = this;
	//#endregion
};

PATHMAP.Marker = function(indexOrstring){
	this.srcName = undefined;
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
