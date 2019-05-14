module.exports = {
	one: validateInput,
	multiple: validateInputs
};


/**
 *
 *
 * @param {Object} object
 * @param {Object} reqType
 * @param {Boolean} useInstanceOfInsteadofTypeof
 * @param {Boolean} supressThrow
 * @returns if object is of given type. Only returns false if supressThrow is true
 */
function validateInput(object,reqType,useInstanceOfInsteadofTypeof,supressThrow){
	let status;
	if(useInstanceOfInsteadofTypeof){
		status = object instanceof reqType;
	}else{
		status = typeof object === reqType;
	}
	if(status){
		return true;
	}else{
		let err = {
			msg:"Given value is not "+(useInstanceOfInsteadofTypeof) ? "instance":"type"+" of "+reqType,
			obj:object
		};
		if(supressThrow){
			console.error(err);
			return false;
		}else{
			throw err;
		}
	}
}
/**
 *
 *
 * @param {Object[]} objectArr
 * @param {Object[]} reqType
 * @param {Boolean[]} useInstanceOfInsteadofTypeof
 * @param {Boolean} supressThrow
 * @returns if object is of given type. Only returns false if supressThrow is true
 */
function validateInputs(objectArr,reqType,useInstanceOfInsteadofTypeof,supressThrow){
	let errors = [];
	if(!(Array.isArray(objectArr)&&Array.isArray(reqType)&&Array.isArray(useInstanceOfInsteadofTypeof))){
		throw "CRITICAL ERROR: FIRST THREE ARGS NEED TO BE ARRAYS!";
	}
	if(!(objectArr.length === reqType.length === useInstanceOfInsteadofTypeof.length)){
		throw "CRITICAL ERROR: GIVEN ARRAYS TO validateInput VARY IN LENGTH"
	}
	

	for(let iterator = 0;iterator<objectArr.length;iterator++){
		let status = validateInput(
			objectArr[iterator],
			reqType[iterator],
			useInstanceOfInsteadofTypeof[iterator],
			true);
		if(!status){
			errors.push({
				msg:"Given value is not "+(useInstanceOfInsteadofTypeof[iterator]) ? "instance":"type"+" of "+reqType[iterator],
				obj:objectArr[iterator]
			});
		}
	}

	if(errors.length !== 0){
		if(!supressThrow){
			throw errors;
		}
		else{
			console.error(errors);
			return false;
		}
	}else{
		return true;
	}
}