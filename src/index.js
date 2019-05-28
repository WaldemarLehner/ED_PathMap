
const workerCallbacks = require("./webworkers/callBackHandler");
const workerPreperation = require("./webworkers/initWebWorkers");
const jQuery = require("jquery");
jQuery(document).ready(()=>{
	let canvasWorker = workerPreperation.canvasWorker("webworkers/canvas.worker.js", workerCallbacks);
});

