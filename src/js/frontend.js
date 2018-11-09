/*
This script handles UI (such as loader animations) and the data-import;
Requires jQuery to function properly;
*/


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
