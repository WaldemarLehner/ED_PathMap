/* eslint-disable no-console */
var UI = require("./UI");
const jQuery = require("jquery");
const __DATA__ = require("./configuration/__DATASOURCE__");
UI.updateBigText();
UI.updateSmallText("Fetching logs from EDSM");

//When document is ready
jQuery(document).ready(function(){
	jQuery(() => {
		jQuery.ajax({
			url: (typeof __DATA__.api.logs === "undefined") ? __DATA__.default + "src/data/logs.json" : __DATA__.api.logs,
			error: () => { throw "Failed to get the Travel History from EDSM. Please submit an Issue on Github"; },
			success: data => {
				UI.updateLoadingBar("XHRFinished"); //XHR Finished
				const workerCallbacks = require("./webworkers/callBackHandler");
				const workerPreperation = require("./webworkers/initWebWorkers");
				UI.updateBigText();
				UI.updateSmallText("Processing travel history");
				let prepWorker = workerPreperation.preparationWorker("webworkers/prepareData.js",workerCallbacks.callback);
				let canvasWorker = workerPreperation.canvasWorker("webworkers/canvas.worker.js", workerCallbacks.callback);
				workerCallbacks.addWorkers(prepWorker,canvasWorker);
				prepWorker.postMessage({json:data,url:window.location.href});
				//Tell the worker to start rendering the skybox, the galmap, and the sectors
				//canvasWorker.post(["set.skybox.init","TODO, PATH TO SKYBOX FOLDER"],["set.initGalPlane"]);
			}
		});
	});
});


//const _FrontEnd = require("./frontend/main");
