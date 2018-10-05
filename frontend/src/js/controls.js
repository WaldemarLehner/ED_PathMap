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
	this.timeToMaxKeySpeed = 500; //:number in Milliseconds
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
	var _dPosition_maxSpeed = 100; //ly/s
	var _dPosition_multiplier = 0;
	var _angleCameraWorld = 0; //:float
	var _dAngle_actual = new THREE.Euler();
	var _dAngle_desired = new THREE.Euler();
	var _dZoom_actual = 0;
	var _dZoom_desired = 0;
	var _MouseWheelZoom = 0;
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
	var _cameraLookAtAxis = new THREE.Vector3();
	//Mouse Position at the beginning of a mouse movement
	var _mouse = {
		position : {
			before: new THREE.Vector2(-1,-1),
			now: new THREE.Vector2(-1,-1)
		},
		isPressed: {
			mouseLeft:false,
			mouseRight:false
		},
		zoom:{
			toDo: 0,

		},
		needsUpdate:false
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
	window.addEventListener("wheel",function(e){
		onmouseWheel(e.deltaY);
	});
	window.addEventListener("keydown", function(e) {
		onkeyDown(e.keyCode);
	});
	window.addEventListener("keyup", function(e) {
		onkeyUp(e.keyCode);
	});
	window.addEventListener("mousedown",function(e){
		e.preventDefault();
		onmouseDown(e.which);
	});
	window.addEventListener("mouseup",function(e){
		e.preventDefault();
		onmouseUp(e.which);
	});
	window.addEventListener("mousemove",function(e){
		e.preventDefault();
		onmouseMove(e);
	});
	function onmouseWheel(e){
		_mouse.zoom.toDo += e;

	}
	//1: left click //2: middle click //3: right click
	function onmouseDown(code){
		if(code === 1){
			_mouse.isPressed.mouseLeft = true;
		}
		else if(code === 3){
			_mouse.isPressed.mouseRight = true;
		}
	}
	function onmouseUp(code){
		if(code === 1){
			_mouse.isPressed.mouseLeft = false;
		}
		else if(code === 3){
			_mouse.isPressed.mouseRight = false;
		}
	}
	function onmouseMove(code){
		// right → +x | down → +y
		_mouse.position.now = new THREE.Vector2(code.clientX,window.innerHeight-code.clientY);

		if(!(_mouse.isPressed.mouseLeft&&_mouse.isPressed.mouseRight)){

			let posA = _mouse.position.before;
			let posB = _mouse.position.now;
			let dX = posB.x-posA.x;
			let dY = posB.y-posA.y;
			if(_mouse.isPressed.mouseLeft){
				let v = 0.003;

				let rot = _currentCameraRotation;

				if(posA.x !== posB.x || posA.y !== posB.y){
					//if posA !== posB

					rot.y -= dX*v;
					rot.x += dY*v;
				}
				_currentCameraRotation.set(rot.x,rot.y,rot.z);
				_mouse.needsUpdate = true;
			}
			else if(_mouse.isPressed.mouseRight){
				let v = 1;
				let vector = new THREE.Vector3(-dX*v,-dY*v,0);
				vector.applyQuaternion(_camera.quaternion);
				_target.x += vector.x;
				_target.y += vector.y;
				_target.z += vector.z;
				_mouse.needsUpdate = true;
			}
		}
	}
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
	_camera.rotation.order = "YXZ";
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
		//#region KEY FUNCTIONALITY
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
		//#endregion
		//#region MOUSE FUNCTIONALITY
		//#region [Mouse] Zoom
		if(_mouse.zoom.toDo !== 0){
		_mouse.needsUpdate = true;
		_distanceToTarget += _mouse.zoom.toDo;
		_mouse.zoom.toDo = 0;
	}
		//#endregion



		//#endregion
		_mouse.position.before = _mouse.position.now;
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
		let y = _dPosition_desired.y;
		_dPosition_desired.applyQuaternion(_camera.quaternion);
		let vector = _dPosition_actual;
		let dMultiplication = 0.5;
		let dMultiplication_braking = 2;
		let normalized = new THREE.Vector3(_dPosition_desired.x,y,_dPosition_desired.z).normalize();
		if(_dPosition_desired.x !== 0 || y !== 0 ||_dPosition_desired.z){
			if(_dPosition_multiplier < _dPosition_maxSpeed){
				_dPosition_multiplier += dMultiplication;
				if(_dPosition_multiplier > _dPosition_maxSpeed){
					_dPosition_multiplier = _dPosition_maxSpeed;
				}
			}else if(_dPosition_multiplier > _dPosition_maxSpeed){
					_dPosition_multiplier -= dMultiplication;
					if(_dPosition_multiplier < 0){
						_dPosition_multiplier = 0;
					}
			}
			vector = normalized.multiplyScalar(_dPosition_multiplier);
		} else {
			_dPosition_multiplier -= dMultiplication_braking;
				if(_dPosition_multiplier < 0){
					_dPosition_multiplier = 0;
				}
			vector.normalize().multiplyScalar(_dPosition_multiplier);
			}


		_dPosition_actual = vector;

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
		if (_this.needsCameraUpdate()) {
			_camera.rotation.set(_currentCameraRotation.x, _currentCameraRotation.y, _currentCameraRotation.z);
			 _cameraLookAtAxis = new THREE.Vector3(0,0,-1).applyQuaternion(_camera.quaternion);
			_camera.position.set(_target.x+_cameraLookAtAxis.x*_distanceToTarget*-1, _target.y+_cameraLookAtAxis.y*_distanceToTarget*-1, _target.z+_cameraLookAtAxis.z*_distanceToTarget*-1);

		}
	}
	this.needsCameraUpdate = function() {

		//[Mouse]
		if(_mouse.needsUpdate){
			return true;
		}
		//[Panning]
		if (_dPosition_actual.x !== 0 || _dPosition_actual.y !== 0 || _dPosition_actual.z !== 0 ){
			return true;
		}
		//[Rotation]
		if (_dAngle_actual.x !== 0 || _dAngle_actual.y !== 0 || _dAngle_actual.z !== 0){
			return true;
		}
		//[Zoom]
		if(_dZoom_actual !== 0){
			return true;
		}
		return false;
	};
	//#endregion
};
THREE.EDControls.prototype = Object.create(THREE.EventDispatcher.prototype);
