/*
This script handles UI (such as loader animations) and the data-import;
Requires jQuery to function properly;
*/

//< Open Preloader when done loading page
$(document).ready(function(){
  $(".preload_active").addClass("transitionAll");
  $(".preload_active").removeClass("preload_active");
});


//< Define UI Class

class UI{
  static createError(errorText,durationInMs){
    //TODO
  }
  static createWarning(errorText,durationInMs){
    //TODO
  }
  static createInfo(errorText,durationInMs){
    //TODO
  }
}
class Loader{
  static isLoaderActive(boolean){
    if(typeof boolean !== "boolean"){
      console.error("Error in Loader.isLoaderActive(): Given argument is not a boolean variable.");
      return undefined;
    }
  }
  static isAnimationActive(boolean){
    if(typeof boolean !== "boolean"){
      console.error("Error in Loader.isLoaderActive(): Given argument is not a boolean variable.");
      return undefined;
    }
  }
  static changeText(bigText,smallText){
    //use a value that is not a string (null, undefined, number ...) to not update
    if(typeof bigText === "string"){
      //Update big Text
    }
    if(typeof smallText === "string"){
      //Update big Text
    }
  }



}
