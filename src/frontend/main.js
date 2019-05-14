/*
This script handles UI (such as loader animations) and the data-import;
Requires jQuery to function properly;
*/
const jQuery = require("jquery");
const dateRangePicker = require("daterangepicker");
const canvasInterface = require("../canvasInterface");
const UI = require("../UI");
module.exports =  {
	//Execute this when the Browser is done loading everything.
	execWhenReady: () => {
		//#region DateRangePicker
		const daterangepickerArgs = require("../configuration/DateRangePicker");
		jQuery("#daterange").daterangepicker({daterangepickerArgs});
		//Hide the DatePicker when clicking outside of the window or hitting cancel
		jQuery("#daterange").on("cancel.daterangepicker hide.daterangepicker",() => {
			jQuery("#daterange").addClass("hidden");
			jQuery("#check_limit_selection > input").prop("checked",false);
		});
		//Apply start- and endDate and reload the page with said parameters
		jQuery("#daterange").on("apply.daterangepicker",(e,picker) => {
			let startDate = picker.startDate.format("YYYY-MM-DD");
			let endDate = picker.endDate.format("YYYY-MM-DD");
			window.open((window.location.href).split("?")[0]+"?[DATE]"+startDate+";"+endDate+"[/DATE]","_self");
		});
		//#endregion
		//#region NavBar Input
		//#region Settings
		
	//#endregion
	//#endregion
	}
};

