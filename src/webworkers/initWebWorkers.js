


module.exports = {
	preparationWorker: preparationWorker
	
};

function preparationWorker(pathToWebWorkerScript,callback){

	//let worker = (typeof name === "string")? new Worker(pathToWebWorkerScript,{name:name}) :new Worker(pathToWebWorkerScript);
	let worker = new require("worker-loader!./prepareData/main.js")();
	worker.addEventListener("message",function(msg){
		callback(msg);
	},false);
	worker.addEventListener("error",function(msg){
		callback([{
			cmd:"error",
			params: msg
		}]);
	},false);
	return worker;
}