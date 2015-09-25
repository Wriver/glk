var glk = require('../src/glk.js');
glk.debug = false;
var $ = require("jquery");

describe("App name space", function () {

    it("Root object defined: glk", function () {
        expect(glk).toBeDefined();
    });
    it("glk.model", function () {
        expect(glk.model).toBeDefined();
    });
    it("glk.view", function () {
        expect(glk.view).toBeDefined();
    });
    it("glk.util", function () {
        expect(glk.util).toBeDefined();
    });
});

describe("glk.util Functions", function () {
    it("Manual test required", function () {
        expect(false).toBe(true);
    });
});

describe("Models", function () {

    it("Defines model.Cell", function () {
        expect(glk.model.Cell).toBeDefined();
    });

    it("with the correct attributes", function () {
        var aCell = new glk.model.Cell({x: 0, y: 0, showData: false});
        expect(aCell.get("data")).toEqual(0);
    });

    it("Defines CellCollection", function () {
        expect(glk.model.CellCollection).toBeDefined();
    });

    it("Defines model.Game", function () {
        expect(glk.model.Game).toBeDefined();
    });

    describe( "Check model.Game functions", function(){

        var game = {},
            aModel = {};

        beforeEach( function(){
            game = new glk.model.Game();
            aModel = new glk.model.Cell();
        });
        it( "pick a model", function(){
            var picked = game.drawer.length;
            game.pick( aModel );
            expect( game.drawer.length).toEqual( picked + 1 );
        });

        it( "generate collection", function(){
            var myArray = [1,2,3];
            var myCollection = game.generateCollection( myArray, false );
            expect( myCollection.length).toEqual( myArray.length );
            expect( myCollection.at(0).get("showData")).toBe( false );
            expect( myCollection.at(1).get("data")).toBe(2);
        });
    });

});

describe("Views", function () {

    it("Defines view.Cell", function () {
        expect(glk.view.Cell).toBeDefined();
    });

    describe("Check view.Cell functions ", function () {
        var canvas = document.createElement('canvas'),
            mouseClick = document.createEvent("MouseEvents"),
            aCell = {},
            cellView = {};

        canvas.id = "glk-canvas";
        canvas.width = 500;
        canvas.height = 500;
        canvas.style.padding = 0;
        canvas.style.margin = 0;
        document.body.appendChild(canvas);
        glk.canvas = canvas;

        beforeEach(function () {
            aCell = new glk.model.Cell({x: 0, y: 0, showData: false});
            viewCell = new glk.view.Cell({model: aCell});
        });

        it("is My Event ", function () {

            mouseClick.initMouseEvent("click", true, true, canvas,
                1, 38, 28, 38, 28,
                false, false, false, false,
                0, null);
            expect(viewCell.isMyEvent(mouseClick)).toBe(true);
        });

        it("is not MyEvent ", function () {

            mouseClick.initMouseEvent("click", true, true, canvas,
                1, 38, 190, 38, 190,
                false, false, false, false,
                0, null);
            expect(viewCell.isMyEvent(mouseClick)).toBe(false);
        });

        it("model changed on Click", function () {

            viewCell.render();
            mouseClick.initMouseEvent("click", true, true, canvas,
                1, 38, 20, 38, 20,
                false, false, false, false,
                0, null);
            canvas.dispatchEvent(mouseClick);

            var rect = canvas.getBoundingClientRect();
            glk.util.log("Canvas info left: " + rect.left + " top: " + rect.top);
            expect(aCell.get("showData")).toBe(true);

        });
    });

    it("Defines view.CellCollection", function () {
        expect(glk.view.CellCollection).toBeDefined();
    });
});