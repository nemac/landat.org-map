!function(e){function n(o){if(t[o])return t[o].exports;var r=t[o]={exports:{},id:o,loaded:!1};return e[o].call(r.exports,r,r.exports,n),r.loaded=!0,r.exports}var t={};return n.m=e,n.c=t,n.p="",n(0)}([function(e,n,t){e.exports=t(1)},function(e,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0});var o=t(2),r=function(e){o(e,s)},s=function(e){renderLayerList(e.layers)};window.Base=r,n.default={Base:r}},function(e,n){"use strict";function t(e,n){o(e,n)}function o(e,n){var t=new XMLHttpRequest;t.onreadystatechange=function(){if(4==t.readyState){try{var e=JSON.parse(t.responseText)}catch(e){console.log("ERROR: Malformed JSON in config file."),console.log(e)}n(e)}},t.open("GET",e,!0),t.send(),console.log("hi")}Object.defineProperty(n,"__esModule",{value:!0}),n.ParseConfig=t}]);