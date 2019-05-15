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
	let status = (useInstanceOfInsteadofTypeof) ? (object instanceof reqType) : (typeof object === reqType);
	if(status){
		return true;
	}else{
		let err = generateError(object,reqType,useInstanceOfInsteadofTypeof);
		return returnResult([err],supressThrow);
	}
}

function generateError(object,reqType,useInstanceOfInsteadofTypeof){
	return {
		msg: "Given value is not " + (useInstanceOfInsteadofTypeof) ? "instance" : "type" + " of " + reqType,
		obj: object	
	};
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
	throwInternalErrors([objectArr,reqType,useInstanceOfInsteadofTypeof]);
	for(let iterator = 0;iterator<objectArr.length;iterator++){
		let status = validateInput(
			objectArr[iterator],
			reqType[iterator],
			useInstanceOfInsteadofTypeof[iterator],
			true);
		if(!status){
			errors.push(generateError(objectArr[iterator],reqType,useInstanceOfInsteadofTypeof));
		}
	}
	return returnResult(errors,supressThrow);
}

function areAllArrays(arrOfArrays){
	let allArrays = true;
	for(let i = 0;i<arrOfArrays.length;i++){
		if(!Array.isArray(arrOfArrays[i])){
			allArrays = false;
			break;
		}
	}
	return allArrays;
}

function areAllArraysOfEqualLen(arrOfArrays){
	let sameLen = true;
	let len = arrOfArrays[0];
	for(let i = 1;i<arrOfArrays.length;i++){
		if(len !== arrOfArrays[i].length){
			sameLen = false;
			break;
		}
	}
	return sameLen;
	
}

function throwInternalErrors(arrays){
	if (!areAllArrays(arrays)) {
		throw "CRITICAL ERROR: FIRST THREE ARGS NEED TO BE ARRAYS!";
	}
	if (!areAllArraysOfEqualLen(arrays)) {
		throw "CRITICAL ERROR: GIVEN ARRAYS TO validateInput VARY IN LENGTH";
	}
}

function returnResult(errors,supressThrow){
	if (errors.length === 0) {
		return true;
	} else {
		if (supressThrow) {
			console.error(errors);
			return false;
		}
		else {
			throw errors;
		}
	}
}