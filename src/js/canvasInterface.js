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
PATHMAP.Interface = function(camera, scenes, controls, linesref, pointsref, logList, sysList) {
	if (!(camera instanceof THREE.PerspectiveCamera || camera instanceof THREE.OrthographicCamera)) {
		throw "First paremeter needs to a THREE.js camera.";
	}
	if (!Array.isArray(scenes)) {
		throw "Second parameter needs to be a an array of all scenes";
	}
	if (!(controls instanceof THREE.EDControls)) {
		throw "Third paremeter needs to be typeof THREE.EDControls";
	}
	if (!Array.isArray(logList)) {
		throw "6th param needs to an array with all Travel Locations";
	}
	if (typeof sysList !== "object") {
		throw "7th param needs to be an object containing system coords";
	}
	if (!(this instanceof PATHMAP.Interface)) {
		return new PATHMAP.Interface(camera, scenes, controls);
	}



	//#region API
	//#region GET
	this.getCamera = function() {
		return _camera;
	};
	this.getScene = function(index) {
		return _scenes[index];
	};
	this.getMarkers = function() {
		return _markers;
	};
	this.getControls = function() {
		return _controls;
	};
	this.getSystemInFocus = function() {
		return getSystemByIndex(_currentIndex);
	};
	this.killSystemUI = function() {
		if (typeof _sysUI !== "undefined") {
			_scenes[2].remove(_scenes[2].getObjectByName("systemInfo"));
			_sysUI = undefined;
		}
	};
	//#endregion
	//#region SET
	this.addMarker = function(vPos, marker, returnMarker) {
		if (!(marker instanceof PATHMAP.Marker)) {
			throw "Expected a PATHMAP.Marker object as 2nd argument.";
		}
		if (!(vPos instanceof THREE.Vector3)) {
			throw "Expected a THREE.Vector3 object as 1st argument.";
		}
		let retMarker = (typeof returnMarker === "boolean") ? returnMarker : false;
		let markerObj = new THREE.Sprite(getMarkerMaterial(marker.srcName));
		markerObj.position.set(-vPos.x, vPos.y, vPos.z);
		markerObj.center.y = 0;
		let sizeDivider = 20;
		markerObj.scale.set(1 / sizeDivider, 1.2 / sizeDivider, 1);
		_markers.push(markerObj);
		_scenes[2].add(markerObj);
		//_markers.push(markerObj);
		if (retMarker) {
			return markerObj;
		} else {
			return this;
		}
	};
	//#region Focus Functions
	this.focusCamera = function(vPos, Distance, eEuler, time) {
		let _pos, dist, euler;
		if (vPos instanceof THREE.Vector3) {
			_pos = vPos;
			_pos.x *= -1;
		} else {
			throw "first parameter needs to be the position. This has to be a new THREE.Vector3. This parameter is is not optional.";
		}
		if (typeof Distance === "number") {
			if (Distance < 0) {
				dist = -Distance;
				console.warn("Second parameter is negative. Multiplying by -1");
			} else {
				dist = Distance;
			}
		} else {
			console.warn("Second parameter is not a number. Using a default value of 50 for the distance.");
		}
		if (eEuler instanceof THREE.Euler) {
			euler = eEuler;
			if (euler.z !== 0) {
				euler.z = 0;
				console.warn("z component of Euler angle will not be used.");
			}
		} else {
			eEuler = null;
		}
		_controls.focusAt(_pos, dist, euler, time);
	};
	this.focus = {
		current: function(showSystemData) {
			focusAtSystem(getSystemByIndex(_currentIndex), showSystemData);
		},
		next: function(showSystemData) {
			_currentIndex = (_currentIndex < _logList.length - 1) ? (_currentIndex = _currentIndex++) : (_logList.length - 1);
			_currentIndex++;
			focusAtSystem(getSystemByIndex(_currentIndex), showSystemData);
		},
		previous: function(showSystemData) {
			_currentIndex = (_currentIndex > 0) ? (_currentIndex - 1) : (0);
			focusAtSystem(getSystemByIndex(_currentIndex), showSystemData);
		},
		first: function(showSystemData) {
			_currentIndex = 0;
			focusAtSystem(getSystemByIndex(_currentIndex), showSystemData);
		},
		last: function(showSystemData) {
			_currentIndex = _logList.length - 1;
			focusAtSystem(getSystemByIndex(_currentIndex), showSystemData);
		},
		nth: function(index,showSystemData) {
			if(typeof index !== "number"){
				throw "first parameter needs to be a number.";
			}
			let logLength = _logList.length;
			if(index > _logList.length-1){
				console.warn("Index was greater than logList length and has been clamped.");
				index = _logList.length-1;
			}else if(index < 0){
				console.warn("Index may not be smaller than 0 and therefore has been clamped up to 0.");
				index = 0;
			}
			_currentIndex = index;
			focusAtSystem(getSystemByIndex(_currentIndex), showSystemData);

		}
		//TODO ... should player be added here?
	};
	//#endregion
	this.showSystemDots = function(bool) {
		if (typeof bool !== "boolean") {
			throw "Given argument is not a boolean value.";
		}
		for (let sector in pointsref) {
			if (!pointsref.hasOwnProperty(sector)) {
				continue;
			}
			pointsref[sector].visible = bool;
		}
		return _this;
	};
	this.showSystemLines = function(bool) {
		if (typeof bool !== "boolean") {
			throw "Given argument is not a boolean value.";
		}
		for (let sector in linesref) {
			if (!linesref.hasOwnProperty(sector)) {
				continue;
			}
			linesref[sector].userData.lockVisibility = !bool;
			linesref[sector].visible = bool;
		}
		return _this;
	};
	//#endregion
	//#region private Functions
	function getMarkerMaterial(materialName) {
		let spriteMap = new THREE.TextureLoader().load("src/img/ui/markers/" + materialName + ".png");
		let mat = new THREE.SpriteMaterial({
			map: spriteMap,
			color: 0xFFFFFF
		});
		mat.sizeAttenuation = false;
		return mat;
	}

	function getSystemByIndex(index) {
		let cobj = sysList[_logList[index].name];
		let object = {
			name: _logList[index].name,
			date: _logList[index].date,
			coords: {
				x: cobj.x,
				y: cobj.y,
				z: cobj.z
			},
			count: cobj.count
		};
		return object;
	}

	function generateSystemInfo(sysInfo, returnObj) {
		let canvas = document.createElement("canvas");
		canvas.width = 512;
		canvas.height = 128;
		let ctx = canvas.getContext("2d");
		let texture = new THREE.Texture(canvas);
		let fontSize1 = 40;
		let fontSize2 = 25;
		let convergence = 15;
		let backgrd_margin = 10;
		ctx.globalAlpha = 0.6;
		roundRect(14,backgrd_margin+4,canvas.width-14,canvas.height-backgrd_margin-4,16,"black",false);
		ctx.globalAlpha = 1;
		roundRect(14,backgrd_margin+4,canvas.width-14,canvas.height-backgrd_margin-4,16,"orange",true);
		ctx.font = fontSize1 + "px Calibri";
		ctx.textAlign = "left";
		ctx.fillStyle = "#ff7100";
		let visitText = (sysInfo.count == 1) ? " visit" : " visits";

		ctx.fillText(sysInfo.name, 25, fontSize1 + convergence, canvas.width - 40);
		ctx.font = fontSize2 + "px sans-serif";
		ctx.fillStyle = "#b34f00";
		ctx.fillText(sysInfo.count + visitText, 25, canvas.height / 2 + fontSize2 + 20 - convergence, 100);
		ctx.fillText(sysInfo.date,25+100+10,canvas.height/2+fontSize2+20-convergence,canvas.width-135);
		//draw little triangle pointing at system.
		ctx.beginPath();
		ctx.moveTo(0,canvas.height/2);
		ctx.lineTo(14,canvas.height/2-15);
		ctx.lineTo(14,canvas.height/2+15);
		ctx.lineTo(0,canvas.height/2);
		ctx.globalAlpha = 0.5;
		ctx.fillStyle = "orange";
		ctx.fill();
		texture.needsUpdate = true;
		let material = new THREE.SpriteMaterial({
			map: texture,
			color: 0xFFFFFF
		});
		material.sizeAttenuation = false;
		let sysText = new THREE.Sprite(material);
		sysText.position.set(-sysInfo.coords.x, sysInfo.coords.y, sysInfo.coords.z);
		sysText.center.x = -0.05;
		let sizeDivider = 7.5;
		sysText.scale.set(4 / sizeDivider, 1 / sizeDivider, 1);
		sysText.name = "systemInfo";
		_sysUI = sysText;
		_scenes[2].add(sysText);
		return (returnObj) ? _sysUI : _this;

		function roundRect(x0, y0, x1, y1, r, color,makeStroke) {
			var w = x1 - x0;
			var h = y1 - y0;
			if (r > w / 2) r = w / 2;
			if (r > h / 2) r = h / 2;
			ctx.beginPath();
			ctx.moveTo(x1 - r, y0);
			ctx.quadraticCurveTo(x1, y0, x1, y0 + r);
			ctx.lineTo(x1, y1 - r);
			ctx.quadraticCurveTo(x1, y1, x1 - r, y1);
			ctx.lineTo(x0 + r, y1);
			ctx.quadraticCurveTo(x0, y1, x0, y1 - r);
			ctx.lineTo(x0, y0 + r);
			ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
			ctx.closePath();
			if(makeStroke){
				ctx.strokeStyle = color;
				ctx.stroke();
			}else{
				ctx.fillStyle = color;
				ctx.fill();
			}
		}
	}

	function focusAtSystem(system, showSystemInfo) {
		console.log(system);
		let directionCamera_System = new THREE.Vector3(_camera.position.x - system.coords.x, _camera.position.y - system.coords.y, _camera.position.z - system.coords.z);
		directionCamera_System.clampLength(100, 10000);

		_this.focusCamera(new THREE.Vector3(system.coords.x, system.coords.y, system.coords.z), directionCamera_System.length(), undefined, 1000);
		if (showSystemInfo) {
			_this.killSystemUI();
			return generateSystemInfo(system);
		}
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
	var _currentIndex = 0;
	var _logList = logList;
	var _sysList = sysList;
	var _services = {};
	//#endregion
};

PATHMAP.Marker = function(indexOrstring) {
	this.srcName = undefined;
	if (typeof indexOrstring === "number") {
		// index definitions (indexArray)
		let iA = [
			"bookmark", // 0
			"bookmark_aqua",
			"bookmark_green",
			"bookmark_lime",
			"bookmark_peach",
			"bookmark_pink", // 5
			"bookmark_red",
			"bookmark_violet",
			"bookmark_white",
			"bookmark_yellow",
			"communitygoal", // 10
			"engineer",
			"expedition_start",
			"expedition_waypoint",
			"expedition_finish",
			"expedition_member", // 15
			"mission",
			"ship",
			"friends",
			"wing" // 19
		];
		if (indexOrstring < 0) {
			console.warn("Second parameter, if number, has to be positive. Setting to 0");
			indexOrstring = 0;
		}
		if (indexOrstring > iA.length - 1) {
			console.log("Given index is out of bounds. Clamping to biggest possible value: " + iA.length - 1);
			indexOrstring = iA.length - 1;
		}
		this.srcName = iA[indexOrstring];


	} else if (typeof indexOrstring === "string") {
		this.srcName = indexOrstring;
	}
};

//#endregion
