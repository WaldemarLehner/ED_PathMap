/*
This script handles UI (such as loader animations) and the data-import;
Requires jQuery to function properly;
*/

$(document).ready(function(){
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
