//Check the Data that has been passed by the EDSM API.
//To simulate API calls, a module that stores an array of stringified JSONs has been created and will be loaded in.
const expect = require("chai").expect;
const sinon = require("sinon");
const rewire = require("rewire");
const subject = rewire("../../../src/prepareData/main");
const validJSONs = require("./data/getLogsValid");
//First, check that correctly formated JSONs are validated correctly


subject.__set__("date",{
	getIndexDateBounds: ()=> {return [4,24];}
});
let validateJSON = subject.__get__("validateJSON");
let validateSingleEntry = subject.__get__("isElementValid");
let validateTimeFormat = subject.__get__("isTimeInRightFormat");
let invalidJSONs = require("./data/getLogsInvalid");
describe("src/prepareData/main.js > isElementValid(el)",function(){
	context("with a valid element",function(){
		it("should pass the test, which means ret true",function(){

			let el = {
				name: "This is the name",
				x: 23,y:34.2,z:-232,
				dateVisited: "2018-12-02 13:43:22"
			};
			
			expect(validateSingleEntry(el)).true;
		});
	});
	context("with one of the coords not being a number",function(){
		
		it("should return false",function(){
			let el = {
				name: "This is the name",
				x: "23", y: 34.2, z: -232,
				dateVisited: "2018-12-02 13:43:22"
			};
			expect(validateSingleEntry(el)).false;
		});
	});
	context("with the coords missing",function(){
		it("should return false", function () {
			let el = {
				name: "This is the name",
				
				dateVisited: "2018-12-02 13:43:22"
			};
			expect(validateSingleEntry(el)).false;
		});
	});
	context("with one of the coords being NaN",function(){
		it("should return false", function () {
			let el = {
				name: "This is the name",
				x: NaN, y: 34.2, z: -232,
				dateVisited: "2018-12-02 13:43:22"
			};
			expect(validateSingleEntry(el)).false;
		});
	});
	context("with the name being an object",function(){
		it("should return false",function(){
			let el = {
				name: {name:"This is the name"},
				x: 23, y: 34.2, z: -232,
				dateVisited: "2018-12-02 13:43:22"
			};
			expect(validateSingleEntry(el)).false;
		});
	});
	context("with the passed argument being not an object",function(){
		it("should throw an error informing that the function is used wrong", function () {
			let el = "Hello World!";
			let errmsg;
			try {
				validateSingleEntry(el);
			} catch (err) {
				errmsg = err.message;
			}
			expect(errmsg).equals("Passed argument needs to be typeof object. An object that represents an entry from the logs.");

		});
	});
	context("with no args passed",function(){
		it("should throw an error informing that the function is used wrong",function(){
			let el = undefined;
			let errmsg;
			try{
				validateSingleEntry(el);
			}catch(err){
				errmsg = err.message;
			}
			expect(errmsg).equals("No argument has been passed. This method needs an entry from the logs as object to be passed.");
		});
	});
});



//Validate multiple
describe("src/prepareData/main.js > validateJSON",function(){
	context("with a valid json (2 tests)",function(){
		it("should pass the test, which means return true",function(){
			let jsonsToTest = validJSONs;
			for (let i = 0; i < jsonsToTest.length; i++) {
				expect(validateJSON(JSON.parse(jsonsToTest[i]))).true;
			}
		});
	});
	context("with a malformed json",function(){
		it("should return false",function(){
			let jsonsToTest = invalidJSONs;
			for (let i = 0; i < jsonsToTest.length; i++) {
				expect(validateJSON(JSON.parse(jsonsToTest[i]))).false;
			}
		});
	});
	context("with a string passed as arg",function(){
		it("should throw an error informing that the function is used wrong",function(){
			let jsonsToTest = validJSONs;
			let errs = [];
			jsonsToTest.forEach(element => {
				try {
					validateJSON(element);
				} catch (error) {
					errs.push(error.message);
				}
			});
			errs.forEach(el => {
				expect(el).equal("Passed argument needs to be typeof object. An object that represents an entry from the logs.");
			});
		});
	});
	context("with no args passed", function () {
		it("should throw an error informing that the function is used wrong", function () {
			
			let errs;
			
			try {
				validateJSON();
			} catch (error) {
				errs = (error.message);
			}
			
			
			expect(errs).equal("No argument has been passed. This method needs the logs as object to be passed.");
			
		});
	});
	context("with an empty object",function(){
		it("should throw an error informing that the object is empty",function(){
			let errs;

			try {
				validateJSON({});
			} catch (error) {
				errs = (error.message);
			}
			expect(errs).equal("An empty object has been passed");
		});
	});
});

//Validate isTimeRightFormat
describe("src/prepareData/main.js > isTimeInRightFormat",function(){
	context("with a valid string passed",function(){
		it("should return true",function(){
			[
				"2017-09-05 14:19:30",
				"2005-02-08 22:00:59",
				"2007-09-09 04:11:11"
			].forEach(value => {
				expect(validateTimeFormat(value)).true;
			});
		});
	});
	context("with an invalid string passed",function(){
		it("should return false",function(){
			[
				"Hello World!",
				"10/21/19",
				"14:20:20",
				"05-09-2019 14:19:30",
				"2005-9-1 04:11:11",
				"01.03.2018 04:11:11"
			].forEach(value => {
				expect(validateTimeFormat(value)).false;
			});
		});
	});
	context("with an argument that is not a string",function(){
		it("should return false",function(){
			[undefined,32,1337,[1,3,4],{3:232,"hello":123},NaN].forEach(value => {
				expect(validateTimeFormat(value)).false;
			});
		});
	});

});