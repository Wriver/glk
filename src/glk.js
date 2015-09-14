module.exports = (function () {

    var Backbone = require('backbone');
    var $ = require('jquery');
    var _ = require('underscore');

    var glk = glk || {};
    glk.model = glk.model || {};
    glk.view = glk.view || {};
    glk.util = glk.util || {};
    glk.canvas = glk.canvas || {};
    glk.debug = true;

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
        canvasContext.fillStyle = "#FFAA00";
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
            cellColor: "#FFAA00",
            dataColor: "#FFFFFF",
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
                cellColor = this.model.get("cellColor"),
                dataColor = this.model.get("dataColor"),
                showData = this.model.get("showData");

            glk.util.log(this.logComponent + " - render - x: " + x + " y:" + y + " width:" + width + " height: " + height);

            canvasContext.fillStyle = cellColor;
            canvasContext.fillRect(x, y, width, height);

            if (showData) {
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
        }
    });

    glk.model.CellCollection = Backbone.Collection.extend({
        model: glk.model.Cell,
    });

    glk.view.CellCollection = Backbone.View.extend({
        logComponent: "glk.view.CellCollection",
        render: function () {
            var canvasContext = glk.canvas.getContext("2d"),
                length = this.collection.length,
                i;
            glk.util.log(this.logComponent + " - render cells " + length);

            if (length === 0) {
                // Clear canvas
                canvasContext.clearRect(0, 0, glk.canvas.width, glk.canvas.height);
            } else {
                // Show all cells
                for (i = 0, length = this.collection.length; i < length; i++) {
                    new glk.view.Cell({model: this.collection.at(i)}).render();
                }
            }
        }
    });

    glk.model.Game = Backbone.Model.extend({
        logComponent: "glk.model.Game",
        drawer: [], // store picked number
        gameView: {},
        cellMatrix: {}, // All models
        defaults: {
            totalNumbers: 49, // How many continuous numbers available to pick.
            drawerNumbers: 7, // Hoe many numbers will be in a drawer.
            cols: 7 // Hom many columns to display all numbers
        },

        initialize: function () {

            var count = this.get("totalNumbers"),
                cols = this.get("cols"),
                datas = _.shuffle(_.range(1, count + 1));

            glk.util.log(this.logComponent + " - initialize() is called");
            this.cellMatrix = this.generateCollection(datas, false);
        },

        // One click on cell, pick the cell data into the drawer.
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

            this.drawer.sort(function (a, b) {
                return a - b;
            });

            _.each(this.cellMatrix.models, function (model) {
                model.clear({silent: true});
            });
            this.cellMatrix.reset(null);
            this.gameView.render();

            this.cellMatrix = this.generateCollection(this.drawer, true);
            this.gameView = new glk.view.CellCollection({collection: this.cellMatrix});
            this.gameView.render();

            glk.util.drawTextWrap(doneMessage, 0, 150, glk.canvas.width, 50);
        },

        start: function () {
            this.gameView = new glk.view.CellCollection({collection: this.cellMatrix});
            this.gameView.render();
        },

        /*
            Return a model collection according to an array
         */
        generateCollection: function (dataArray, dataVisible) {

            var matrix = new glk.model.CellCollection(),
                arrayLength = dataArray.length,
                cols = this.get("cols"),
                cellWidth = Math.ceil(glk.canvas.getBoundingClientRect().width / cols),
                cellHeight = cellWidth,
                col = 0,
                row = 0,
                temp = {},
                i;

            for (i = 0; i < arrayLength; i++) {
                col = i % cols;
                row = Math.floor(i / cols);
                temp = new glk.model.Cell({
                    x: col * cellWidth,
                    y: row * cellHeight,
                    data: dataArray[i],
                    showData: dataVisible
                });
                temp.on("pick", this.pick, this);
                matrix.add(temp);
            }
            return matrix;
        }
    });
    return glk;
})();
