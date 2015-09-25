module.exports = (function () {

    var Backbone = require('backbone');
    var $ = require('jquery');
    var _ = require('underscore');

    var glk = glk || {};
    glk.model = glk.model || {};
    glk.view = glk.view || {};
    glk.util = glk.util || {};
    glk.canvas = glk.canvas || {};
    glk.debug = false;

    glk.util.log = function (msg) {
        if (glk.debug) {
            console.log(msg);
        }
    };

    /*
     Wrap long string and draw it on canvas
     */

    glk.util.drawTextWrap = function (text, x, y, lineWidth, lineHeight) {

        var canvasContext = glk.canvas.getContext("2d"),
            words = text.split(' '),
            line = "";

        canvasContext.font = "30px Comic Sans MS";
        canvasContext.fillStyle = "#69D2E7";
        canvasContext.textBaseline = "middle";
        canvasContext.textAlign = "left";

        for (var i = 0; i < words.length; i++) {
            if (canvasContext.measureText(line + words[i]).width < lineWidth) {
                line = line + words[i] + " ";
            } else {
                canvasContext.fillText(line, x, y);
                // If the first word is longer than lineWidth, keep it in the same line.
                if (i > 0) {
                    y = y + lineHeight;
                }
                line = words[i] + " ";
            }
        }
        canvasContext.fillText(line, x, y);
    };

    glk.model.Cell = Backbone.Model.extend({
        defaults: {
            data: 0,
            x: 0,
            y: 0,
            width: 50,
            height: 50,
            showData: false,
            cellColor: "#69D2E7",
            dataColor: "#FA6900",
            coverColor: "#69D2E7",
            border_width: 0
        }
    });

    glk.view.Cell = Backbone.View.extend({
        logComponent: "glk.view.Cell",
        el: "body",
        initialize: function () {
            glk.util.log(this.logComponent + " - initialize() is called");
            this.model.on("change", this.render, this);
        },
        events: {
            'click': "onClick"
        },
        render: function () {
            var canvasContext = glk.canvas.getContext("2d"),
                x = this.model.get("x"),
                y = this.model.get("y"),
                width = this.model.get("width"),
                height = this.model.get("height"),
                data = this.model.get("data"),
                coverColor = this.model.get( "coverColor"),
                cellColor = this.model.get("cellColor"),
                dataColor = this.model.get("dataColor"),
                showData = this.model.get("showData");

            glk.util.log(this.logComponent + " - render - x: " + x + " y:" + y + " width:" + width + " height: " + height);

            canvasContext.fillStyle = coverColor;
            canvasContext.fillRect(x, y, width, height);

            if (showData) {
                canvasContext.fillStyle = cellColor;
                canvasContext.fillRect(x, y, width, height);

                canvasContext.font = "40px Comic Sans MS";
                canvasContext.fillStyle = dataColor;
                canvasContext.textAlign = "center";
                canvasContext.textBaseline = "middle";
                canvasContext.fillText(data, x + width / 2, y + height / 2);

            }
            return this;
        },

        onClick: function (evt) {
            if (this.isMyEvent(evt)) {
                glk.util.log(this.logComponent + " - onClick is called");
                if (!this.model.get("showData")) {
                    this.model.set("showData", true);
                    this.model.trigger("pick", this.model);
                }
            }
        },

        isMyEvent: function (evt) {
            var canvasRect = glk.canvas.getBoundingClientRect(),
                leftBoundry = canvasRect.left + this.model.get("x"),
                rightBoundry = leftBoundry + this.model.get("width"),
                topBoundry = canvasRect.top + this.model.get("y"),
                bottomBoundry = topBoundry + this.model.get("height");

            if (evt.clientX > leftBoundry && evt.clientX < rightBoundry &&
                evt.clientY > topBoundry && evt.clientY < bottomBoundry) {
                return true;
            }

            return false;
        },

        clearEvent: function(){
            this.model.off();
            this.undelegateEvents();
        }
    });

    glk.model.CellCollection = Backbone.Collection.extend({
        model: glk.model.Cell,
    });

    glk.view.CellCollection = Backbone.View.extend({
        logComponent: "glk.view.CellCollection",
        viewCollection:[],
        render: function () {
            var canvasContext = glk.canvas.getContext("2d"),
                length = this.collection.length,
                i,
                v;

            glk.util.log(this.logComponent + " - render cells " + length);

            if (length === 0) {
                // Clear canvas
                canvasContext.clearRect(0, 0, glk.canvas.width, glk.canvas.height);
            } else {
                // Show all cells
                for (i = 0, length = this.collection.length; i < length; i++) {
                    v = new glk.view.Cell({model: this.collection.at(i)});
                    v.render();
                    this.viewCollection.push( v );
                }
                glk.util.log(this.logComponent + " - viewCollection.length " + length);
            }
        },

        clear: function(){

            // Unbind all events to avoid memory leak
            for( var i = 0, length = this.viewCollection.length; i < length; i++ ){
                this.viewCollection[i].clearEvent();
            }

            this.collection.reset(null);
            this.render();
        }

    });

    glk.model.Game = Backbone.Model.extend({
        logComponent: "glk.model.Game",
        drawer:[], // Used to store picked number
        gameView: {},
        cellMatrix: {}, // All models
        cellLength: 60, // cell length.
        cellSpacing:5,  // Distance between cells, not supposed to customized.
        defaults: {
            totalNumbers: 49, // How many continuous numbers available to pick.
            drawerNumbers: 7, // Hoe many numbers will be in a drawer.
            cols: 7 // Hom many columns in cell matrix. Choose correct number to suit for mobile device.
        },

        initialize: function () {
            var screenWidth = window.innerWidth ||
                    document.documentElement.clientWidth ||
                    document.body.clientWidth,
                cols = this.get( "cols"),
                count = this.get("totalNumbers");

            glk.util.log( this.logComponent + " - initialize() is called" + " with drawer: " + this.drawer );

            // If the screen can only display less than "cols" columns, it might be a mobile device, then
            // make the game taking up whole screen width and change the cavans width to screen width.
            if( screenWidth > 0 && screenWidth/this.cellLength < cols ){
                cols = Math.floor(screenWidth/this.cellLength);
                this.cellLength = screenWidth / cols;
                this.set( "cols", cols);
            }

            // No space need for rightest cells.
            glk.canvas.width = this.cellLength * cols - this.cellSpacing;
            // No space need for the bottom cells.
            glk.canvas.height = Math.ceil(count / cols ) * this.cellLength - this.cellSpacing;
            // Reduce cellLength by cellSpacing
            this.cellLength = this.cellLength - this.cellSpacing;
            glk.util.log( this.logComponent + " - screenWidth: " + screenWidth + " canavsWidth:" + glk.canvas.width +
                 " cellLength: " + this.cellLength );

            this.initGame();
        },

        initGame: function(){
            var count = this.get("totalNumbers"),
                datas = _.shuffle(_.range(1, count +1 ));

            this.drawer = [];
            this.cellMatrix = this.generateCollection(datas, false);
            this.gameView = new glk.view.CellCollection({collection: this.cellMatrix});
        },

        reset: function(){
            this.gameView.clear();
            this.initGame();
            this.start();
        },

        // click on cell, pick the cell data into the drawer.
        pick: function (pickedModel) {
            this.drawer.push(pickedModel.get("data"));
            glk.util.log(this.logComponent + " - picked " + this.drawer);

            if (this.drawer.length >= this.get("drawerNumbers")) {
                this.done();
            }
        },

        done: function () {
            var canvasContext = glk.canvas.getContext("2d"),
                doneMessage = "Buy above number. If you win, 0.1% to the developer and don't quit your job. :) Good Luck!";

            this.gameView.clear();

            // show the draw content
            this.drawer.sort(function (a, b) {
                return a - b;
            });
            this.cellMatrix = this.generateCollection(this.drawer, true);
            this.gameView = new glk.view.CellCollection({collection: this.cellMatrix});
            this.gameView.render();

            glk.util.drawTextWrap(doneMessage, 10, 220, glk.canvas.width, 40);
        },

        start: function () {
            this.gameView.render();
        },

        /*
         Return a model collection according to an array
         */
        generateCollection: function (dataArray, dataVisible) {

            var matrix = new glk.model.CellCollection(),
                arrayLength = dataArray.length,
                cols = this.get("cols"),
                col = 0,
                row = 0,
                temp = {},
                i;

            for (i = 0; i < arrayLength; i++) {
                col = i % cols;
                row = Math.floor(i / cols);
                temp = new glk.model.Cell({
                    x: col * ( this.cellLength + this.cellSpacing ),
                    y: row * ( this.cellLength + this.cellSpacing ),
                    width: this.cellLength,
                    height: this.cellLength,
                    data: dataArray[i],
                    showData: dataVisible,
                    coverColor:"#"+Math.random().toString(16).slice(-6)
                });
                temp.on("pick", this.pick, this);
                matrix.add(temp);
            }
            return matrix;
        },

    });
    return glk;
})();
