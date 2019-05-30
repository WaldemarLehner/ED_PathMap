//This is the configuration which determines how systems and connections are drawn on the map.

module.exports = {
	systems:{
		color:{
			colorGradient: [0x66000E,0x07DB00], 
			minVal: 0,
			maxVal: 100,
			//If this is set, maxVal will be overwritten with whatever is the maximum from the logs.
			useMaxValueFromLogsInstead: true
		},
		size:{
			minSize: 1,
			maxSize: 10,
			//If this is true, the more complex SizeMapper will be used instead
			useSizeMapperInstead: true,
			sizeMapper: {
				//This will expect the actual visits (for example 92) rather than a value between 0 and 1
				useAbsoluteValues: true,
				//Here you enter the quantity of visits (use absolute values like 5 or 20 if "useAbsoluteValues" 
				//is set, else use a value between 0 and 1). [Quantity of Visits , Size to return]. Linear Interpolation will occur between systems
				sizeValues: [
					[0,1],[10,10],[20,15],[30,20],[50,25],[100,30],[200,35]
				]
			}
		}
	},
	connections:{
		color:{
			colorGradient: [0x66000E, 0x07DB00],
			minVal: 0,
			maxVal: 100,
			//If this is set, maxVal will be overwritten with whatever is the maximum from the logs.
			useMaxValueFromLogsInstead: true
		}
	},
	canvasInterface:{
		show:{
			galPlane: true,
			galSectors: false,
			skybox: true,
			systems: true,
			connections: true,
			sysInfo: true
		}
	}

};