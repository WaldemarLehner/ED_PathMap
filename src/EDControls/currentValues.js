const THREE = require("three");
//Values in here will be overwritten on runtime. Use ./configuration.js instead
module.exports = {
	rotation: {
		current: new THREE.Euler(),
		deltaAngle: {
			actual: new THREE.Euler(),
			desired: new THREE.Euler()
		}
	},
	position: {
		target: new THREE.Vector3(),
		deltaPosition:{
			actual: new THREE.Vector3(),
			desired: new THREE.Vector3(),
			multiplier: 0
		}	
	},
	zoom: {
		deltaZoom:{
			actual: 0,
			desired: 0
		},
		distanceMultiplier: 1
	},
	keyPressed:{
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
	},
	mouse:{
		position:{
			before: new THREE.Vector2(),
			now: new THREE.Vector2()
		},
		isPressed:{
			left: false,
			right: false
		},
		zoom:{
			toDo: 0
		},
		requireUpdate: false
	},
	camera:{
		camera: undefined,
		transition:{
			isInTransition: false,
			animationTimeValue: 0,
			position:{
				original: new THREE.Vector3(),
				desired: new THREE.Vector3()
			},
			rotation:{
				original: new THREE.Euler(),
				desired: new THREE.Euler()
			},
			distance:{
				original: 0,
				desired: 0
			}
		}
	}
};



