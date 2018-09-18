/*
 * @author Waldemar Lehner
 */

THREE.EDControls = function(camera) {
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
		zoomIn: 88, //X
		zoomOut: 89 //Y
	};
	this.minDistance = 10; //:float
	this.maxDistance = 10000; //:float
	this.dampingFactor = 0.3; //:float
	this.keySpeed = {
		pan: 100, //:float | lyr/second
		rotate: 45, //:float | degrees / second
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
	var _distanceCameraFocus; //:float
	var _dPosition_actual = new THREE.Vector3(); //:THREE.Vector3
	var _dPosition_desired = new THREE.Vector3(); //:THREE.Vector3
	var _dAngle_actual = new THREE.Euler();
	var _dAngle_desired = new THREE.Euler(); //:THREE.Vector2
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
		zoomOut: false
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

		} else if (_this.keys.up === code) {
			_areKeysPressed.up = true;

		} else if (_this.keys.down === code) {
			_areKeysPressed.down = true;

		} else if (_this.keys.zoomIn === code) {
			_areKeysPressed.zoomIn = true;

		} else if (_this.keys.zoomOut === code) {
			_areKeysPressed.zoomOut = true;

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

		}
	}

	//#endregion
	//#region Update
	this.update = function() {
		if(!_this.enabled){return;}
		_oldTime = _newTime;
		_newTime = Date.now();
		let dTime = _newTime - _oldTime;
		if (dTime > 1000) {
			return; /*do nothing*/
		}
		console.log(dTime);

		//#region Key Functionality [Moving]
		//Set up the vector for transforming the focus position without applying camera rotation yet;
		let vector_raw = new THREE.Vector3();


		if (!(_areKeysPressed.front && _areKeysPressed.back)) {
			if (_areKeysPressed.front) {
				vector_raw.z++;
			} else if (_areKeysPressed.back) {
				vector_raw.z--;
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
		console.log("Gewünscht:");
		console.log(_dPosition_desired);



		console.log("Tatsächlich:");
		_target.add(calculateCurrentDeltaAnkerPosition((dTime/_this.timeToMaxKeySpeed) * _this.keySpeed.pan));
		console.log(_target);
		//console.log(calculateCurrentDeltaAnkerPosition(20));
		//#endregion
		//Apply camera rotation around the vertical axis to the vector so when you press "forward" it doesnt go +x but actually where the camera is pointing at.
		//camera rotation  :  x → pitch // y → yaw (positive = turns left) //z → roll
		/*
		if(_camera.rotation.y !== 0){

			//get angle to rotate
			let angle = new THREE.Vector3(_camera.rotation.x,0,_camera.rotation.z).angleTo(new THREE.Vector3(0,0,1));
			//rotate vector around y axis

			let vector_rotated = _dPosition_actual.applyAxisAngle(new THREE.Vector3(0,1,0),angle);
			//console.log(vector_rotated);
		}*/
		//#endregion

		//console.log(vector_raw.x,vector_raw.y,vector_raw.z);
		//Update camera position/rotation;
		//transformCamera();
	};
	//#endregion
	//#region Pan Smoothing
	function calculateCurrentDeltaAnkerPosition(v){
		let a = [
			[_dPosition_actual.x,_dPosition_desired.x],
			[_dPosition_actual.y,_dPosition_desired.y],
			[_dPosition_actual.z,_dPosition_desired.z]
		];
		let b = [];
		for(let i = 0;i < 3;i++){
			//Skip is actual === desired value
			if(a[i][0] === a[i][1]){
				continue;}
			//Actual is bigger than desired. Reduce value by v;
			if(a[i][0] > a[i][1]){
				a[i][0] = Math.round((a[i][0]-v)*10)/10;
				if(a[i][0] < a[i][1]){
					a[i][0] = a[i][1];
				}
			}
			//Actual is smaller than desired. Increase value by v;
			else if(a[i][0] < a[i][1]){
				a[i][0] = Math.round((a[i][0]+v)*10)/10;
			}
		}
		_dPosition_actual = new THREE.Vector3(a[0][0],a[1][0],a[2][0]);
		//update actual values.
		return _dPosition_actual;
	}
	//#endregion
	//#region Transform Camera
	function transformCamera(){
		//camera rotation

		_camera.rotation = _currentCameraRotation;
		//camera position
		let lookAtVector = new THREE.Vector3(); //TODO: generate normalized look At Vector
			//get camera lookat vector
		_camera.position.addVectors(_target,lookAtVector.multiplyScalar(-(_distanceCameraFocus)));

	}
	//#endregion
};
THREE.EDControls.prototype = Object.create(THREE.EventDispatcher.prototype);
