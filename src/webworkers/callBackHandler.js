//This module handles the callbacks from 

/*
*	Command Structure:
*	cmd: command name. The command to execure
*	params: the parameters
*
*/

/* CMD LIST (cmd | params)
* setPreparedData | data-object
*
*/

module.exports = (MessageEvent) => {
	let arrayOfCommands = MessageEvent.data;
	validateArray(arrayOfCommands);
	arrayOfCommands.forEach((el)=>{
		let cmd = getCommandByString(el.cmd);
		if(typeof cmd === "function"){
			cmd(el.params);
		}else{
			console.error("Could not find the command.", el);
		}
	});
};

/**
 * @param {Array} arr
 */
function validateArray(arr){
	if(!Array.isArray(arr)){
		throw "This function expects an Array of Objects {cmd: string, param: any}";
	}
	arr.forEach((el)=>{
		if(typeof el.cmd !== "string"){
			throw "The Command needs to be typeof String";
		} 
	});
	return true;
}

function getCommandByString(string){
	let commands = {
		setPreparedData : setPreparedData,
		error: logError,
		UI: userInterface
	};
	return commands[string];
}

function setPreparedData(data){
	console.log("setPreparedDate has been called with:",data);
}

function logError(data){
	console.error("One of the Webworkers sent this Error:",data);
}

function userInterface(data){
	console.log("userInterface has been called with:", data);
}