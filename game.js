"use strict";
var Canvas = require('canvas');

module.exports = {
    Game: function() {
        this.gameState = {
            map: [],
            paused: false,
            won: false,
            rejectAction: false,
            move: 0,
            initOnceDone: false,
            wonPlayer: 0
        }

        /**
         * Only initalize once for these functions, can prevent race condition
         */
        this.initOnce = function () {
            if (this.gameState.initOnceDone) {
                return false;
            }

            this.canvas = new Canvas(640, 480);
            this.context = this.canvas.getContext('2d');
            this.gameState.initOnceDone = true;
        };

        this.init = function () {
            this.gameState.map = [];
            this.gameState.paused = false;
            this.gameState.won = false;
            this.gameState.rejectAction = false;
            this.gameState.move = 0;
            this.initOnce();

            var i, j;
            for (i = 0; i <= 6; i++) {
                this.gameState.map[i] = [];
                for (j = 0; j <= 7; j++) {
                    this.gameState.map[i][j] = 0;
                }
            }
            this.clearMap();
            this.drawMask();
            // this.print();
        };

        this.playerMove = function () {
            if (this.gameState.move % 2 === 0) {
                return 1;
            }
            return -1;
        };

        this.print = function () {
            var i, j, msg;
            msg = "\n";
            msg += "Move: " + this.gameState.move;
            msg += "\n";
            for (i = 0; i < 6; i++) {
                for (j = 0; j < 7; j++) {
                    msg += " " + this.gameState.map[i][j];
                }
                msg += "\n";
            }
            console.log(msg);
        };

        this.win = function (player) {
            if (this.gameState.won) {
                return false;
            }
            this.gameState.wonPlayer = player;
            this.gameState.paused = true;
            this.gameState.won = true;
            this.gameState.rejectAction = false;
            var msg = null;
            if (player > 0) {
                msg = "You win";
            } else if (player < 0) {
                msg = "Computer wins";
            } else {
                msg = "It's a draw";
            }
            msg += " - Thanks for playing";
            this.context.save();
            this.context.font = '14pt sans-serif';
            this.context.fillStyle = "#111";
            this.context.fillText(msg, 200, 20);
            this.context.restore();
            console.info(msg);
        };
        this.fillMap = function (state, column, value) {
            var tempMap = state.clone();
            if (tempMap[0][column] !== 0 || column < 0 || column > 6) {
                return -1;
            }

            var done = false,
                row = 0,
                i;
            for (i = 0; i < 5; i++) {
                if (tempMap[i + 1][column] !== 0) {
                    done = true;
                    row = i;
                    break;
                }
            }
            if (!done) {
                row = 5;
            }
            tempMap[row][column] = value;
            return tempMap;

        };

        this.action = function (column, callback) {
            if (this.gameState.paused || this.gameState.won) {
                return 0;
            }
            if (this.gameState.map[0][column] !== 0 || column < 0 || column > 6) {
                return -1;
            }

            var done = false;
            var row = 0, i;
            for (i = 0; i < 5; i++) {
                if (this.gameState.map[i + 1][column] !== 0) {
                    done = true;
                    row = i;
                    break;
                }
            }
            if (!done) {
                row = 5;
            }
            this.gameState.map[row][column] = this.playerMove(this.gameState.move);
            this.gameState.move++;
            this.drawMap();
            this.check();
            // this.print();
            callback();
            this.gameState.paused = true;
            return 1;
        };

        this.check = function () {
            var i, j, k;
            var temp_r = 0, temp_b = 0, temp_br = 0, temp_tr = 0;
            for (i = 0; i < 6; i++) {
                for (j = 0; j < 7; j++) {
                    temp_r = 0;
                    temp_b = 0;
                    temp_br = 0;
                    temp_tr = 0;
                    for (k = 0; k <= 3; k++) {
                        //from (i,j) to right
                        if (j + k < 7) {
                            temp_r += this.gameState.map[i][j + k];
                        }
                        //from (i,j) to bottom
                        if (i + k < 6) {
                            temp_b += this.gameState.map[i + k][j];
                        }

                        //from (i,j) to bottom-right
                        if (i + k < 6 && j + k < 7) {
                            temp_br += this.gameState.map[i + k][j + k];
                        }

                        //from (i,j) to top-right
                        if (i - k >= 0 && j + k < 7) {
                            temp_tr += this.gameState.map[i - k][j + k];
                        }
                    }
                    if (Math.abs(temp_r) === 4) {
                        this.win(temp_r);
                    } else if (Math.abs(temp_b) === 4) {
                        this.win(temp_b);
                    } else if (Math.abs(temp_br) === 4) {
                        this.win(temp_br);
                    } else if (Math.abs(temp_tr) === 4) {
                        this.win(temp_tr);
                    }

                }
            }
            // check if draw
            if ((this.gameState.move === 42) && (!this.gameState.won)) {
                this.win(0);
            }
        };

        this.drawCircle = function (x, y, r, fill, stroke) {
            this.context.save();
            this.context.fillStyle = fill;
            this.context.strokeStyle = stroke;
            this.context.beginPath();
            this.context.arc(x, y, r, 0, 2 * Math.PI, false);
            //this.context.stroke();
            this.context.fill();
            this.context.restore();
        };
        this.drawMask = function () {
            // draw the mask
            // http://stackoverflow.com/questions/6271419/how-to-fill-the-opposite-shape-on-canvas
            // -->  http://stackoverflow.com/a/11770000/917957

            this.context.save();
            this.context.fillStyle = "#ddd";
            this.context.beginPath();
            var x, y;
            for (y = 0; y < 6; y++) {
                for (x = 0; x < 7; x++) {
                    this.context.arc(75 * x + 100, 75 * y + 50, 25, 0, 2 * Math.PI);
                    this.context.rect(75 * x + 150, 75 * y, -100, 100);
                }
            }
            this.context.fill();
            this.context.restore();
        };

        this.drawMap = function () {
            var x, y;
            var fg_color;
            for (y = 0; y < 6; y++) {
                for (x = 0; x < 7; x++) {
                    fg_color = "transparent";
                    if (this.gameState.map[y][x] >= 1) {
                        fg_color = "#ff4136";
                    } else if (this.gameState.map[y][x] <= -1) {
                        fg_color = "#0074d9";
                    }
                    this.drawCircle(75 * x + 100, 75 * y + 50, 25, fg_color, "black");
                }
            }
        };
        this.clearMap = function () {
            this.context.save();
            this.context.fillStyle = "#fff";
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.restore();
        };

        this.ai = function (aiMoveValue) {
            var choice = null;

            var state = this.gameState.map.clone();
            function checkState(state) {

                var winVal = 0;
                var chainVal = 0;
                var i, j, k;
                var temp_r = 0, temp_b = 0, temp_br = 0, temp_tr = 0;
                for (i = 0; i < 6; i++) {
                    for (j = 0; j < 7; j++) {
                        temp_r = 0;
                        temp_b = 0;
                        temp_br = 0;
                        temp_tr = 0;
                        for (k = 0; k <= 3; k++) {
                            //from (i,j) to right
                            if (j + k < 7) {
                                temp_r += state[i][j + k];
                            }

                            //from (i,j) to bottom
                            if (i + k < 6) {
                                temp_b += state[i + k][j];
                            }

                            //from (i,j) to bottom-right
                            if (i + k < 6 && j + k < 7) {
                                temp_br += state[i + k][j + k];
                            }

                            //from (i,j) to top-right
                            if (i - k >= 0 && j + k < 7) {
                                temp_tr += state[i - k][j + k];
                            }
                        }
                        chainVal += temp_r * temp_r * temp_r;
                        chainVal += temp_b * temp_b * temp_b;
                        chainVal += temp_br * temp_br * temp_br;
                        chainVal += temp_tr * temp_tr * temp_tr;

                        if (Math.abs(temp_r) === 4) {
                            winVal = temp_r;
                        } else if (Math.abs(temp_b) === 4) {
                            winVal = temp_b;
                        } else if (Math.abs(temp_br) === 4) {
                            winVal = temp_br;
                        } else if (Math.abs(temp_tr) === 4) {
                            winVal = temp_tr;
                        }

                    }
                }
                return [winVal, chainVal];
            }
            function value(state, depth, alpha, beta) {
                var val = checkState(state);
                if (depth >= 4) { // if slow (or memory consumption is high), lower the value

                    // calculate value
                    var retValue = 0;

                    // if win, value = +inf
                    var winVal = val[0];
                    var chainVal = val[1] * aiMoveValue;
                    retValue = chainVal;

                    // If it lead to winning, then do it
                    if (winVal === 4 * aiMoveValue) { // AI win, AI wants to win of course
                        retValue = 999999;
                    } else if (winVal === 4 * aiMoveValue * -1) { // AI lose, AI hates losing
                        retValue = 999999 * -1;
                    }
                    retValue -= depth * depth;

                    return [retValue, -1];
                }

                var win = val[0];
                // if already won, then return the value right away
                if (win === 4 * aiMoveValue) { // AI win, AI wants to win of course
                    return [999999 - depth * depth, -1];
                }
                if (win === 4 * aiMoveValue * -1) { // AI lose, AI hates losing
                    return [999999 * -1 - depth * depth, -1];
                }

                if (depth % 2 === 0) {
                    return minState.bind(this)(state, depth + 1, alpha, beta);
                }
                return maxState.bind(this)(state, depth + 1, alpha, beta);

            }
            function choose(choice) {
                return choice[Math.floor(Math.random() * choice.length)];
            }
            function maxState(state, depth, alpha, beta) {
                var v = -100000000007;
                var move = -1;
                var tempVal = null;
                var tempState = null;
                var moveQueue = [];
                var j;
                for (j = 0; j < 7; j++) {
                    tempState = this.fillMap(state, j, aiMoveValue);
                    if (tempState !== -1) {

                        tempVal = value.bind(this)(tempState, depth, alpha, beta);
                        if (tempVal[0] > v) {
                            v = tempVal[0];
                            move = j;
                            moveQueue = [];
                            moveQueue.push(j);
                        } else if (tempVal[0] === v) {
                            moveQueue.push(j);
                        }

                        // alpha-beta pruning
                        if (v > beta) {
                            move = choose(moveQueue);
                            return [v, move];
                        }
                        alpha = Math.max(alpha, v);
                    }
                }
                move = choose(moveQueue);

                return [v, move];
            }
            function minState(state, depth, alpha, beta) {
                var v = 100000000007;
                var move = -1;
                var tempVal = null;
                var tempState = null;
                var moveQueue = [];
                var j;

                for (j = 0; j < 7; j++) {
                    tempState = this.fillMap(state, j, aiMoveValue * -1);
                    if (tempState !== -1) {

                        tempVal = value.bind(this)(tempState, depth, alpha, beta);
                        if (tempVal[0] < v) {
                            v = tempVal[0];
                            move = j;
                            moveQueue = [];
                            moveQueue.push(j);
                        } else if (tempVal[0] === v) {
                            moveQueue.push(j);
                        }

                        // alpha-beta pruning
                        if (v < alpha) {
                            move = choose(moveQueue);
                            return [v, move];
                        }
                        beta = Math.min(beta, v);
                    }
                }
                move = choose(moveQueue);

                return [v, move];
            }
            var choice_val = maxState.bind(this)(state, 0, -100000000007, 100000000007);
            choice = choice_val[1];
            var val = choice_val[0];
            console.info("AI " + aiMoveValue + " choose column: " + choice + " (value: " + val + ")");

            this.gameState.paused = false;
            var done = this.action(choice, function () {
                this.gameState.rejectAction = false;
            }.bind(this));

            // if fail, then random
            while (done < 0) {
                console.error("Falling back to random agent");
                choice = Math.floor(Math.random() * 7);
                done = this.action(choice, function () {
                    this.gameState.rejectAction = false;
                }.bind(this));
            }

        };
        this.init();
    }
};

// http://stackoverflow.com/questions/13756482/create-copy-of-multi-dimensional-array-not-reference-javascript
Array.prototype.clone = function () {
    var arr = [], i;
    for (i = 0; i < this.length; i++) {
        arr[i] = this[i].slice();
    }
    return arr;
};
