const expect = require("chai").expect;
const sinon = require("sinon");
const rewire = require("rewire");
const subject = rewire("../../../src/prepareData/dateOperations");
let customURL = "";
const getDateLimits = subject.__get__("getDateLimits");


subject.__set__("getURL",()=>{return customURL;});
//Silence
subject.__set__("jQuery",()=>{return {};});
//Rewrite jQuery function so it doesnt access jquery
subject.__set__("addDateLimitsToSettingsUI",(settings)=>{
	//console.log(moment(settings[0]).format("YYYY-MM-DD"),moment(settings[1]).format("YYYY-MM-DD"));
});

describe("src/prepareData/dateOperations.js > getDateLimits()",function(){
	context("with the URL being undefined",function(){
		it("should throw an Error stating that the URL is not typeof string.",function(){
			customURL = undefined;
			let errmsg;
			try{
				subject.getDateLimits();
			}catch(error){
				errmsg = error.message;
			}
			expect(errmsg).equal("Given URL is not typeof string");
		});
	});
	context("with the URL being an empty string",function(){
		it("should throw an Error stating that the URL is 0 chars long.",function(){
			customURL = "";
			let errmsg;
			try {
				subject.getDateLimits();
			} catch (error) {
				errmsg = error.message;
			}

			expect(errmsg).equal("Given URL string is 0 long.");
		});
	});
	context("with the URL being 'https://edsm.net/yourProfile/testMap.html'",function(){
		it("should return false as there are no Date limiters",function(){
			customURL = "https://edsm.net/yourProfile/testMap.html";
			expect(getDateLimits()).to.equal(false);
		});
	});
	context("with the URL being 'https://edsm.net/yourProfile/testMap.html?thisIsSomethingWeird'", function () {
		it("should return false and tell the user that the URL is set up wrong", function () {
			customURL = "https://edsm.net/yourProfile/testMap.html?thisIsSomethingWeird";
			let spy = sinon.spy(console,"error");
			
			expect(getDateLimits()).to.equal(false);
			expect(spy.calledWith("URL is set up incorrect. Ignoring filtering by date.")).true;
			spy.restore();
		});
	});
	context("with the URL being 'https://edsm.net/yourProfile/testMap.html?[DATE]32421'", function () {
		it("should return false and tell the user that the URL is set up wrong", function () {
			customURL = "https://edsm.net/yourProfile/testMap.html?[DATE]32421";
			let spy = sinon.spy(console, "error");

			expect(getDateLimits()).to.equal(false);
			expect(spy.calledWith("URL is set up incorrect. Ignoring filtering by date.")).true;
			spy.restore();
		});
	});
	context("with the URL being 'https://edsm.net/yourProfile/testMap.html?[DATE]32421[/DATE]'", function () {
		it("should return false and tell the user that the URL is set up wrong", function () {
			customURL = "https://edsm.net/yourProfile/testMap.html?[DATE]32421[/DATE]";
			let spy = sinon.spy(console, "error");

			expect(getDateLimits()).to.equal(false);
			expect(spy.calledWith("URL is set up incorrect. Ignoring filtering by date.")).true;
			spy.restore();
		});
	});
	context("with the URL being 'https://edsm.net/yourProfile/testMap.html?[DATE]1557015687;1557915687[/DATE]'", function () {
		it("should return the left and right bounds", function () {
			customURL = "https://edsm.net/yourProfile/testMap.html?[DATE]1557015687;1557915687[/DATE]";
			let spy = sinon.spy(console, "error");
			
			expect(getDateLimits()).deep.equal([1557015687, 1557915687]);
			expect(spy.calledOn).not.true;
			spy.restore();
		});
	});
	context("with the URL being 'https://edsm.net/yourProfile/testMap.html?[DATE]1557915687;1557015687[/DATE]',which mean that the dates are reversed", function () {
		it("should warn the user, flip the bounds and then return the left and right bounds", function () {
			customURL = "https://edsm.net/yourProfile/testMap.html?[DATE]1557915687;1557015687[/DATE]";
			let spy = sinon.spy(console, "warn");

			expect(getDateLimits()).deep.equal([1557015687, 1557915687]);
			expect(spy.calledWith("First date was greater than last date. Reversing order.")).to.be.true;
			spy.restore();
		});
	});
	context("with the URL being 'https://edsm.net/yourProfile/testMap.html?[DATE]1557915687[/DATE]',which mean that only one value is passed",function(){
		it("should return false as 2 values are required.",function(){
			customURL = "https://edsm.net/yourProfile/testMap.html?[DATE]1557915687[/DATE]";
			let spy = sinon.spy(console, "error");
			
			expect(getDateLimits()).false;
			expect(spy.calledWith("URL is set up incorrect. Ignoring filtering by date.")).to.be.true;
			spy.restore();

		});
	});
});

