define(["JS"],function(n){function e(n){return"assets/css/"+n+".css"}var o=n.getLoader();console.log(o),o.addConfig({"#moveable":{extensions:["extensions/mainDemo"],styles:[e("main"),{href:e("moreStyles"),media:"all"}],callback:function(n){console.log(arguments)}},"#otherElement":[{extensions:[],callback:function(){console.log("notMain loaded")}},{extensions:[],callback:function(){console.log("notMain loaded")}}]}).addConfig({"#otherElement":{extensions:[],callback:function(){console.log("This extends the given config")}}}).load()});