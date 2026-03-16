"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.market = void 0;
const i_Market = require("./market");
let canvas;
let graph;
const stock = 1000;
const initialPrice = 100;
let ticks = 0;
function main() {
    /**
     * Initialise:
     * - Canvas
     * - Market
     */
    // currently unsafe use of as - need to update to satisfies
    canvas = document.getElementById('canvas');
    exports.market = new i_Market.Market(initialPrice, stock, 0.01);
    graph = new i_Market.Graph(canvas, [], 10);
    graph.startCandle(initialPrice);
    /** Initialise Update */
    requestAnimationFrame(Update);
}
/**
 * Is called Every Frame
 * Unfixed refresh rate
 */
function Update() {
    ticks++;
    for (let i = 0; i < stock; i++) {
        exports.market.makeOrder();
    }
    for (let i = 0; i < stock; i++) {
        exports.market.takeOrder();
    }
    graph.updateCandle(exports.market.lastPrice);
    graph.draw();
    if (ticks % 10 == 0) {
        graph.startCandle(exports.market.lastPrice);
    }
    ;
    requestAnimationFrame(Update);
}
//# sourceMappingURL=main.js.map