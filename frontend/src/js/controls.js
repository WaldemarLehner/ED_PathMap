THREE.EDControls = function(camera,scene) {
	if (!(this instanceof THREE.EDControls)) {
		return new THREE.EDControls(camera);
	}
	//#region API
	this.enabled = true;
	this.keys = {
		front: 87, //W
		back: 83, //S
		left: 65, //A
		right: 68, //D
		up: 82, //R
		down: 70, //F
		rotateRight: 69, //E
		rotateLeft: 81, //Q
		rotateUp:84,	//T
		rotateDown:71,	//G
		zoomIn: 88, //X
		zoomOut: 89 //Y
	};
	this.usePanningMarkers = true;
	this.minDistance = 10; //:float
	this.maxDistance = 10000; //:float
	this.keySpeed = {
		pan: 100, //:float | lyr/second
		rotate: 10 * Math.PI / 180, //:float | degrees / second
		zoom: 100 //:float | delta_distance to focus / second
	};
	this.keySpeedScale = true; //:boolean
	this.isActive = true; //:boolean
	this.debug = false; //:boolean
	this.blockZoom = false; //:boolean
	this.blockRotation = false; //:boolean
	this.blockPan = false; //:boolean
	this.timeToMaxKeySpeed = 1000; //:number in Milliseconds
	this.focusAt = function(_vector3_, _distance_, _angle_) { //:THREE.Vector3; :float; :THREE.Quaternion
		//#region "focusAt" logic
		//#endregion
	};
	this.getCamera = function() {
		return camera;
	};
	//#endregion
	//#region internal vars
	var _this = this;
	var _target = new THREE.Vector3();
	var _currentPosition = new THREE.Vector3();
	var _currentCameraRotation = new THREE.Euler();
	var _camera = camera; //:THREE.Camera
	var _indicatorGroup;
	var _distanceToTarget = 0; //:float
	var _dPosition_actual = new THREE.Vector3(); //:THREE.Vector3
	var _dPosition_desired = new THREE.Vector3(); //:THREE.Vector3
	var _angleCameraWorld = 0; //:float
	var _dAngle_actual = new THREE.Euler();
	var _dAngle_desired = new THREE.Euler();
	var _dZoom_actual = 0;
	var _dZoom_desired = 0;
	var _oldTime = Date.now(); //:int
	var _newTime = Date.now(); //:int
	var _areKeysPressed = {
		up: false,
		down: false,
		left: false,
		right: false,
		front: false,
		back: false,
		zoomIn: false,
		zoomOut: false,
		rotateUp: false,
		rotateDown: false
	};
	var _ui = {};
	//#endregion
	//#region Setup
	//Set up indicator
	initIndicator();
	function initIndicator(){
		let plane_material_data = [
			new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("src/img/ui/focus/arrow_pan.png"),color:0xFFFFFF,side: THREE.DoubleSide,transparent:true,premultipliedAlpha:true}),
			new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("src/img/ui/focus/arrow_vertical.png"),color:0xFFFFFF,side: THREE.DoubleSide,transparent:true,premultipliedAlpha:true}),
			new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("src/img/ui/focus/focus_circle.png"),color:0xFFFFFF,side: THREE.DoubleSide,transparent:true,premultipliedAlpha:true})
		];
		_indicatorGroup = new THREE.Group();
		let plane_circle = new THREE.Mesh(new THREE.PlaneGeometry(10,10),plane_material_data[2]);
		plane_circle.rotateX(Math.PI/2);
		let plane_arrow_pan = new THREE.Mesh(new THREE.PlaneGeometry(10,10),plane_material_data[0]);
		plane_arrow_pan.rotateX(Math.PI/2);
		let plane_arrow_vert = new THREE.Mesh(new THREE.PlaneGeometry(10,10), plane_material_data[1]);
		_indicatorGroup.add(plane_circle);
		_indicatorGroup.add(plane_arrow_pan);
		_indicatorGroup.add(plane_arrow_vert);
		_ui.focus = {circle: _indicatorGroup.children[0], arrow_pan: _indicatorGroup.children[1], arrow_vert: _indicatorGroup.children[2]};
		scene.add(_indicatorGroup);

	}

	//#endregion
	//#region Listeners
	window.addEventListener("keydown", function(e) {
		onkeyDown(e.keyCode);
	});

	function onkeyDown(code) {


		if (_this.keys.front === code) {
			_areKeysPressed.front = true;

		} else if (_this.keys.back === code) {
			_areKeysPressed.back = true;

		} else if (_this.keys.left === code) {
			_areKeysPressed.left = true;

		} else if (_this.keys.right === code) {
			_areKeysPressed.right = true;

		} else if (_this.keys.up === code) {
			_areKeysPressed.up = true;

		} else if (_this.keys.down === code) {
			_areKeysPressed.down = true;

		} else if (_this.keys.zoomIn === code) {
			_areKeysPressed.zoomIn = true;

		} else if (_this.keys.zoomOut === code) {
			_areKeysPressed.zoomOut = true;

		} else if (_this.keys.rotateLeft === code){
			_areKeysPressed.rotateLeft = true;

		} else if (_this.keys.rotateRight === code){
			_areKeysPressed.rotateRight = true;

		} else if (_this.keys.rotateUp === code){
			_areKeysPressed.rotateUp = true;

		} else if (_this.keys.rotateDown === code){
			_areKeysPressed.rotateDown = true;
		}
	}
	window.addEventListener("keyup", function(e) {
		onkeyUp(e.keyCode);
	});

	function onkeyUp(code) {

		if (_this.keys.front === code) {
			_areKeysPressed.front = false;

		} else if (_this.keys.back === code) {
			_areKeysPressed.back = false;

		} else if (_this.keys.left === code) {
			_areKeysPressed.left = false;

		} else if (_this.keys.right === code) {
			_areKeysPressed.right = false;

		} else if (_this.keys.up === code) {
			_areKeysPressed.up = false;

		} else if (_this.keys.down === code) {
			_areKeysPressed.down = false;

		} else if (_this.keys.zoomIn === code) {
			_areKeysPressed.zoomIn = false;

		} else if (_this.keys.zoomOut === code) {
			_areKeysPressed.zoomOut = false;

		} else if (_this.keys.rotateLeft === code){
			_areKeysPressed.rotateLeft = false;

		} else if (_this.keys.rotateRight === code){
			_areKeysPressed.rotateRight = false;

		} else if (_this.keys.rotateUp === code){
			_areKeysPressed.rotateUp = false;

		} else if (_this.keys.rotateDown === code){
			_areKeysPressed.rotateDown = false;
		}
	}

	//#endregion
	//#region Camera setting
	_camera.eulerOrder = "YXZ";
	//#endregion
	//#region Update
	this.update = function() {
		if (!_this.enabled) {
			return;
		}
		_oldTime = _newTime;
		_newTime = Date.now();
		let dTime = _newTime - _oldTime;
		if (dTime > 1000) {
			return; /*do nothing*/
		}

		//#region Key Functionality [Rotation]
		_dAngle_desired = new THREE.Euler();
		let z = 0.2;
		if(!(_areKeysPressed.rotateDown && _areKeysPressed.rotateUp)){
			if(_areKeysPressed.rotateDown){
				_dAngle_desired.x-=z;
			}
			else if(_areKeysPressed.rotateUp){
				_dAngle_desired.x+=z;
			}
		}
		if(!(_areKeysPressed.rotateLeft && _areKeysPressed.rotateRight)){
			if(_areKeysPressed.rotateRight){
				_dAngle_desired.y-=z;
			}
			else if (_areKeysPressed.rotateLeft){
				_dAngle_desired.y+=z;
			}
		}
		calculateCurrentDeltaRotation((dTime/_this.timeToMaxKeySpeed)*_this.keySpeed.rotate);
		_currentCameraRotation.set(_dAngle_actual.x+_currentCameraRotation.x,_dAngle_actual.y+_currentCameraRotation.y,_dAngle_actual.z+_currentCameraRotation.z);
		console.log(_currentCameraRotation);
		if(_currentCameraRotation.x > 1.4){
			_currentCameraRotation.x = 1.4;
			_dAngle_actual.x = 0;
		}
		else if(_currentCameraRotation.x < -1.4){
			_currentCameraRotation.x = -1.4;
			_dAngle_actual.x = 0;
		}

		//#endregion
		//#region Key Functionality [Moving]
		//Set up the vector for transforming the focus position without applying camera rotation yet;
		let vector_raw = new THREE.Vector3();


		if (!(_areKeysPressed.front && _areKeysPressed.back)) {
			if (_areKeysPressed.front) {
				vector_raw.z--;
			} else if (_areKeysPressed.back) {
				vector_raw.z++;
			}
		}
		if (!(_areKeysPressed.left && _areKeysPressed.right)) {
			if (_areKeysPressed.left) {
				vector_raw.x--;
			} else if (_areKeysPressed.right) {
				vector_raw.x++;
			}
		}
		if (!(_areKeysPressed.up && _areKeysPressed.down)) {
			if (_areKeysPressed.up) {
				vector_raw.y++;
			} else if (_areKeysPressed.down) {
				vector_raw.y--;
			}
		}

		//Normalize Vector so that going (for example) front-right is not faster than just front and set it to max speed.
		//Normalizing gives the vector a length of 1 unit;
		_dPosition_desired = vector_raw.normalize().multiplyScalar(_this.keySpeed.pan);
		//console.log(_distanceToTarget);
		let pan_vector = calculateCurrentDeltaAnkerPosition((dTime / _this.timeToMaxKeySpeed) * _this.keySpeed.pan);
		_target.add(pan_vector);

		//#endregion
		//#region Key Functionality [Zooming]
		_dZoom_desired = 0;
		if (!(_areKeysPressed.zoomIn && _areKeysPressed.zoomOut)) {
			if(_areKeysPressed.zoomIn){
				_dZoom_desired = -(_this.keySpeed.zoom);
			}
			else if(_areKeysPressed.zoomOut){
				_dZoom_desired = _this.keySpeed.zoom;
			}
		}
		_distanceToTarget += calculateCurrentDeltaZoom((dTime/_this.timeToMaxKeySpeed) * _this.keySpeed.zoom);
		//Clamp value
		if(_distanceToTarget > _this.maxDistance){
			_distanceToTarget = _this.maxDistance;
			_dZoom_actual = 0;
		}
		else if(_distanceToTarget < _this.minDistance){
			_distanceToTarget = _this.minDistance;
			_dZoom_actual = 0;
		}
		//#endregion
		//#region UI
		_indicatorGroup.position.set(_target.x,_target.y,_target.z);
		_ui.focus.arrow_vert.rotation.setFromQuaternion(_camera.quaternion,"YXZ");
		_ui.focus.arrow_vert.rotation.x = 0;
		if(_dPosition_actual.x === 0 && _dPosition_actual.z === 0 && _dAngle_actual.y === 0){
			_ui.focus.arrow_pan.visible = false;
		}
		else{
			_ui.focus.arrow_pan.visible = true;
		}
		if(_dPosition_actual.y === 0){
			_ui.focus.arrow_vert.visible = false;
		}
		else{
			_ui.focus.arrow_vert.visible = true;
		}
		//#endregion

		//#endregion


		//Update camera position/rotation;
		transformCamera();
	};
	//#region Pan Smoothing
	function calculateCurrentDeltaAnkerPosition(v) {
		let a = [
			[_dPosition_actual.x, _dPosition_desired.x],
			[_dPosition_actual.y, _dPosition_desired.y],
			[_dPosition_actual.z, _dPosition_desired.z]
		];

		for (let i = 0; i < 3; i++) {
			//Skip is actual === desired value
			if (a[i][0] === a[i][1]) {
				continue;
			}
			//Actual is bigger than desired. Reduce value by v;
			if (a[i][0] > a[i][1]) {
				a[i][0] = Math.round((a[i][0] - v) * 1000) / 1000;
				if (a[i][0] < a[i][1]) {
					a[i][0] = a[i][1];
				}
			}
			//Actual is smaller than desired. Increase value by v;
			else if (a[i][0] < a[i][1]) {
				a[i][0] = Math.round((a[i][0] + v) * 1000) / 1000;
			}
		}

		let vector = new THREE.Vector3(a[0][0], a[1][0], a[2][0]);
		_dPosition_actual = vector;
		let cameraLookAtAxis = new THREE.Vector3(0,0,-1).applyQuaternion(_camera.quaternion);

		let angle = get2dAngle(cameraLookAtAxis.x,cameraLookAtAxis.z,0,-1);
		//TODO: Create a working WASD movement

		//Angle → cos(alpha) = (vA * vB)/(|vA|*|vB|)
		return vector;//.applyAxisAngle(new THREE.Vector3(0,1,0),angle);
	}
	//#endregion
	//#region Zoom Smoothing
	function calculateCurrentDeltaZoom(v) {
		let x = _dZoom_actual;
		let _x = _dZoom_desired;
		if (x === _x) {
			return x;
		}
		if (x > _x) {
			x = Math.round((x - v) * 1000) / 1000;
			if (x < _x) {
				x = _x;
			}
		} else {
			x = Math.round((x + v) * 1000) / 1000;
			if (x > _x) {
				x = _x;
			}
		}
		_dZoom_actual = x;
		console.log(_dZoom_desired);
		console.log(x);
		return x;
	}
	//#endregion
	//#region region Rotation Smoothing
	function calculateCurrentDeltaRotation(v) {
		let a = [
			[_dAngle_actual.x, _dAngle_desired.x],
			[_dAngle_actual.y, _dAngle_desired.y],
			[_dAngle_actual.z, _dAngle_desired.z]
		];
		for (let i = 0; i < 3; i++) {
			//Skip is actual === desired value
			if (a[i][0] === a[i][1]) {
				continue;
			}
			//Actual is bigger than desired. Reduce value by v;
			if (a[i][0] > a[i][1]) {
				a[i][0] = Math.round((a[i][0] - v) * 1000) / 1000;
				if (a[i][0] < a[i][1]) {
					a[i][0] = a[i][1];
				}
			}
			//Actual is smaller than desired. Increase value by v;
			else if (a[i][0] < a[i][1]) {
				a[i][0] = Math.round((a[i][0] + v) * 1000) / 1000;
			}
		}
		_dAngle_actual = new THREE.Euler(a[0][0], a[1][0], a[2][0]);
		return _dAngle_actual;
	}
	//#endregion
	function get2dAngle(x1,x2,y1,y2){
		let atanX = Math.atan2(x1,x2);
		let atanY = Math.atan2(y1,y2);

		return atanX - atanY;
	}
	//#region Transform Camera
	function transformCamera() {
		//camera rotation
		if (needsCameraUpdate()) {
			let cameraLookAtAxis = new THREE.Vector3(0,0,-1).applyQuaternion(_camera.quaternion);
			_camera.position.set(_target.x+cameraLookAtAxis.x*_distanceToTarget*-1, _target.y+cameraLookAtAxis.y*_distanceToTarget*-1, _target.z+cameraLookAtAxis.z*_distanceToTarget*-1);
			_camera.rotation.set(_currentCameraRotation.x, _currentCameraRotation.y, _currentCameraRotation.z);

		}
	}
	function needsCameraUpdate() {
		//[Panning]
		if (_dPosition_actual.x !== 0 || _dPosition_actual.y !== 0 || _dPosition_actual.z !== 0 ){
			return true;
		}
		//[Rotation]
		if (_dAngle_actual.x !== 0 || _dAngle_actual.y !== 0 || _dAngle_actual.z !== 0 ){
			return true;
		}
		//[Zoom]
		if(_dZoom_actual !== 0){
			return true;
		}
		return false;
	}
	//#endregion
};
THREE.EDControls.prototype = Object.create(THREE.EventDispatcher.prototype);