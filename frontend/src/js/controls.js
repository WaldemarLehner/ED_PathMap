/*
 * @author Waldemar Lehner
 */

THREE.EDControls = function(camera) {
	if (!(this instanceof THREE.EDControls)) {
		return new THREE.EDControls(camera);
	}
	//#region API
	this.target = new THREE.Vector3(); //:THREE.Vector3
	this.keys = {
		front: "87", //W
		back: "83", //S
		left: "65", //A
		right: "68", //D
		up: "82", //R
		down: "70", //F
		rotateRight: "69", //E
		rotateLeft: "81", //Q
		zoomIn: "88", //X
		zoomOut: "89" //Y
	};
	this.minDistance = 10; //:float
	this.maxDistance = 10000; //:float
	this.dampingFactor = 0.3; //:float
	this.keySpeed = 100; //:float / second
	this.isActive = true; //:boolean
	this.debug = false; //:boolean
	this.blockZoom = false; //:boolean
	this.blockRotation = false; //:boolean
	this.blockPan = false; //:boolean
	this.focusAt = function(_vector3_, _distance_, _angle_) { //:THREE.Vector3; :float; :THREE.Quaternion
		//#region "focusAt" logic
		//#endregion
	};
	this.getCamera = function() {
		return _camera;
	};
	//#endregion
	//#region internal vars
	var _this = this;
	var _camera = camera; //:THREE.Camera
	var _distanceCameraFocus; //:float
	var _cameraAngle = new THREE.Quaternion(); //:THREE.Quaternion
	var _dPosition_actual = new THREE.Vector3(); //:THREE.Vector3
	var _dPosition_desired = new THREE.Vector3(); //:THREE.Vector3
	var _dAngle_actual = new THREE.Vector2(); //:THREE.Vector2
	var _dAngle_desired = new THREE.Vector2(); //:THREE.Vector2
	var _oldTime = Date.now(); //:int
	var _newTime = Date.now(); //:int
	var _areKeysPressed = {
		up: false,
		down: false,
		left: false,
		right: false,
		front: false,
		back: false
	};

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
		} else if (_this.keys.top === code) {
			_areKeysPressed.top = true;
		} else if (_this.keys.bottom === code) {
			_areKeysPressed.bottom = true;
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
		} else if (_this.keys.top === code) {
			_areKeysPressed.top = false;
		} else if (_this.keys.bottom === code) {
			_areKeysPressed.bottom = false;
		}
	}

	//#endregion
	//#region Update
	this.update = function() {
		update();
	};

	function update() {
		_oldTime = _newTime;
		_newTime = Date.now();
		let dTime = _newTime - _oldTime;
		if (dTime > 1000) {
			return; /*do nothing*/
		}
		//console.log(dTime);
		//#region Key Functionality [Moving]
		//Set up the vector for transforming the focus position without applying camera rotation yet;
		let vector_raw = new THREE.Vector3();
		if (!_areKeysPressed.front && !_areKeysPressed.back) {
			if (_areKeysPressed.front) {
				vector_raw.z++;
			} else if (_areKeysPressed.back) {
				vector_raw.z--;
			}
		}
		if (!_areKeysPressed.left && !_areKeysPressed.right) {
			if (_areKeysPressed.left) {
				vector_raw.x--;
			} else if (_areKeysPressed.right) {
				vector_raw.x++;
			}
		}
		if (!_areKeysPressed.up && !_areKeysPressed.down) {
			if (_areKeysPressed.up) {
				vector_raw.y++;
			} else if (_areKeysPressed.down) {
				vector_raw.y--;
			}
		}
		if (vector_raw == new THREE.Vector3()) {
			console.log(vector_raw);

		}
	}

	//#endregion
};
THREE.EDControls.prototype = Object.create(THREE.EventDispatcher.prototype);
