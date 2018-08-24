/*
This script takes the input-data and filters out any unnecessary data.
In addition to that it sets up a map of Systems which hold the coordinates of said system
Requires jQuery
*/

//eventListeners
$(document).ready(function(){
  $("#fileinput").on("change",importFile);
});


function importFile(){
  let file = document.getElementById("fileinput").files[0];
  if(file === undefined || file === null){
    UI.createError("No file has been selected.",1000);
    return undefined; //cancel operation
  }
  if(file.type != "application/json"){
    UI.createError("Selected file is not in JSON format.",1000);
    return undefined;
  }
  let filereader = new FileReader();
  filereader.onload = function(event){
    filterData(JSON.parse(event.srcElement.result));
  };
  filereader.readAsText(file);


}

function filterData(json_data){

  let length = json_data.logs.length; // For Progress
  if(length < 1){
    UI.createError("Given file has no Systems",1000);
  }
  let json_unfiltered = json_data.logs;
  //Check a random system to see if format is good
  let index = Math.floor(( Math.random() * length) - 1 );
  //console.log(json_unfiltered[index]);
  let testsystem = json_unfiltered[index];
  /* Entry has: (* are required)
    > shipId
    > system*
    > firstDiscover*
    > date*
  */
  if( typeof testsystem.system === "undefined" || typeof testsystem.date === "undefined" ||typeof testsystem.firstDiscover === "undefined"){
    UI.createError("It seems like you are using a wrong file. Please contact the dev or submit a ticket.",3000);
    return undefined;
  }
  //A system map that holds the System name as index and the x y z coords as values. Gets x y z coords from EDSM API.
  var systemMap = {};
  //Create a filtered list
  var json_filtered = [];
  for(let i = 0;i < length; i++){
    json_filtered[i] = {
      system: json_unfiltered[i].system,
      firstDiscover: json_unfiltered[i].firstDiscover,
      date: json_unfiltered[i].date
    };
    systemMap[json_unfiltered[i].system] = {};

  }
  //Flip array so that first entry is at the begining.
  json_filtered.reverse();
  console.log("%c System History","color:#bada55");
  console.log(json_filtered);
  console.log("%c Unique systems only","color:#bada55");
  console.log(systemMap);
  console.log("length: "+Object.keys(systemMap).length);
  //Construct POST Query





}
