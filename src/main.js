var glk = require( './glk.js');

var canvas = document.getElementById("glk-canvas");
glk.canvas = canvas;

var game = new glk.model.Game( { totalNumbers: 49,drawerNumbers: 7 });
game.start();