$ = require( 'jquery');
$(function () {
    var glk = require('./glk.js');
    glk.canvas = document.getElementById("glk-canvas");

    var game = new glk.model.Game({totalNumbers: 49, drawerNumbers: 7, cols: 7});
    game.start();

    $("#reset").click(function () {
        game.reset();
    });

    $("#which_game").change(function () {

        if ($(this).val() === "ca649") {
            game = new glk.model.Game({totalNumbers: 49, drawerNumbers: 6, cols: 7});
            game.start();
        } else if ($(this).val() === "camax") {
            game = new glk.model.Game({totalNumbers: 49, drawerNumbers: 7, cols: 7});
            game.start();
        }
    });
});


