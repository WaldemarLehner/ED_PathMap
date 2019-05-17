/* eslint-disable no-console */
//const THREE = require("three");
const jQuery = require("jquery");
const __DATA__ = require("./configuration/__DATASOURCE__");


//When document is ready
jQuery(document).ready(function(){
	jQuery(() => {
		jQuery.ajax({
			url: (typeof __DATA__.api.logs === "undefined") ? __DATA__.default + "src/data/logs.json" : __DATA__.api.logs,
			error: () => { throw "Failed to get the Travel History from EDSM. Please submit an Issue on Github"; },
			success: data => {
				//UI.updateBigText();
				//UI.updateSmallText("Processing travel history");
				setUpPreparationWorker(data);
				//setUpCanvasWorker();
			}
		});
	});
});

function setUpPreparationWorker(data){
	
}

//const _FrontEnd = require("./frontend/main");
