/* eslint-disable */
/*
This script handles UI (such as loader animations) and the data-import;
Requires jQuery to function properly;
*/

$(document).ready(function(){
//* * * Daterange * * */

  $("#daterange").daterangepicker({
    "showDropdowns": true,
    "minYear": 2014,
    "maxYear": 2020,//new Date().getUTCFullYear(),
    "locale":{
      "format":"YYYY-MM-DD",
      "seperator": " - "
    }
    });
  $("#daterange").on("cancel.daterangepicker hide.daterangepicker",function(e,picker){
    $("#daterange").addClass("hidden");
    $("#check_limit_selection > input").prop("checked",false);
  });
  $("#daterange").on("apply.daterangepicker",function(e,picker){
    let startDate = picker.startDate.format("YYYY-MM-DD");
    let endDate = picker.endDate.format("YYYY-MM-DD");
    window.open((window.location.href).split("?")[0]+"?[DATE]"+startDate+";"+endDate+"[/DATE]","_self");
  });
/* * *  UI Event Listeners  * * */
  $(".action-settings").click(function(){
    if($(this).hasClass("active")){
      //remove class, hide settings window
      $(this).removeClass("active");
      $(".settings_container").removeClass("active");
    }else{
      $(this).addClass("active");
      $(".settings_container").addClass("active");
    }
  });

  //
  $(".action-select-settings-close").click(function(){
    if($(".action-settings").hasClass("active")){
      $(".action-settings").removeClass("active");
      $(".settings_container").removeClass("active");
    }
  });

//#region Navigation Focus Buttons
  $(".action-select-last").click(function(){
    canvasInterface.focus.last(true);
    UI.update();
  });
  $(".action-select-front3").click(function(){
    canvasInterface.focus.nth(canvasInterface.getFocusIndex()+1000,true);
    UI.update();
  });
  $(".action-select-front2").click(function(){
    canvasInterface.focus.nth(canvasInterface.getFocusIndex()+100,true);
    UI.update();
  });
  $(".action-select-front1").click(function(){
    canvasInterface.focus.next(true);
    UI.update();
  });
  $(".action-select-back1").click(function(){
    canvasInterface.focus.previous(true);
    UI.update();
  });
  $(".action-select-back2").click(function(){
    canvasInterface.focus.nth(canvasInterface.getFocusIndex()-100,true);
    UI.update();
  });
  $(".action-select-back3").click(function(){
    canvasInterface.focus.nth(canvasInterface.getFocusIndex()-1000,true);
    UI.update();
  });
  $(".action-select-first").click(function(){
    canvasInterface.focus.first(true);
    UI.update();
  });
//#endregion
//#region Settings
  $("#check_conn_lines").click(function(){
      canvasInterface.showSystemLines($("#check_conn_lines > input").is(":checked"));
  });
  $("#check_sys_points").click(function(){
      canvasInterface.showSystemDots($("#check_sys_points > input").is(":checked"));
  });
  $("#check_show_sys_info").click(function(){
      canvasInterface.showSysInfo($("#check_show_sys_info > input").is(":checked"));
  });
  $("#check_show_cmdr_pos").click(function(){
      canvasInterface.showCmdrPosition($("#check_show_cmdr_pos > input").is(":checked"));
  });
  $("#check_show_friend_pos").click(function(){
      canvasInterface.showFriendsPosition($("#check_show_friend_pos > input").is(":checked"));
  });
  $("#check_limit_selection").click(function(){
    let isChecked = $("#check_limit_selection > input").is(":checked");
    if(!isChecked){
      $("#daterange").addClass("hidden");
      if(__DATESET_LIMITED_BY_DATE__){
        window.open((window.location.href).split("?")[0],"_self");
      }
    }else{
      $("#daterange").removeClass("hidden");
    }
  });
//#endregion
});


UI = {objects:{}};
UI.objects.Loader = function(){
  //references
  let text1;
  let text2;
  let this_ = this;
  $(document).ready(function(){
    text1 = $("#loader_text_big");
    text2 = $("#loader_text_small");
  });


  //Joke Texts. Get displayed as the big text on the Loading Screen. Does not contain any useful information
  let joketexts = [
    "Friendship Drive charging",
    "Honking ADS",
    "Finding Raxxla",
    "Taking pictures of Asps in front of things",
    "Fuelscooping",
    "Repairing FSD",
    "Hiding the cookie jar"
  ];
  this.updateText1 = function(stringOrUndefined){
    let text;
    if(typeof stringOrUndefined !== "string"){
      text = joketexts[Math.floor(Math.random()*joketexts.length)]+"...";
    }else{
      text = stringOrUndefined;
    }
    text1.text(text);
  };
  this.updateText2 = function(string){
    let text;
    if(typeof string !== "string"){
      text = "";
      console.warn("no message has been passed to be displayed. Showing an empty string instead.");
    }else{
      text = string;
    }
    text2.text(text);
  };
  this.hide = function(){
    if($(".loader").hasClass("active")){
      $(".loader").removeClass("active");
    }
    setTimeout(function(){
      $(".loader").addClass("hidden");
    },500);
  };
  this.show = function(){
    this_.animation.start();
    if(!$(".loader").hasClass("active")){
      $(".loader").addClass("active");
    }
    if(!$(".loader").hasClass("hidden")){
      $(".loader").removeClass("hidden");
    }
  };

};
UI.Loader = new UI.objects.Loader();
$(document).ready(function(){
  UI.Loader.updateText1();
});
UI.update = function(){
  let count = canvasInterface.getFocusIndex();
  let data = canvasInterface.getSystemInFocus();
  $("#nav_sysname").text(data.name);
  $("#nav_sysdate").text(data.date);
  $("#nav_systemid").text(count.toString()+" / "+(canvasInterface.getLogList().length-1).toString());
};
