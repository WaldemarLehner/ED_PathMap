//The Configuration for the EDControls object
module.exports = {
	usePanningMarkers : true,
	minDistance : 10, //:float
	maxDistance : 10000, //:float
	keySpeed : {
		pan : 100, //:float | lyr/second
		rotate : 10 * Math.PI / 180, //:float | degrees / second
		zoom : 100 //:float | delta_distance to focus / second
	},
	keySpeedScale : true, //:boolean
	isActive : true, //:boolean
	debug : false,//:boolean
	blockZoom : false, //:boolean
	blockRotation : false, //:boolean
	blockPan : false, //:boolean
	maxSpeed:{
		delta:{
			position: 100//(lyr)
		},
		timeToReach: 500 //(ms)
	},
	cameraTransition:{
		timeToAnimate: 1000
	}
};