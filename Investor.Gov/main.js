import { Market } from "./market.js";
import { Graph } from "./graph.js";
let canvas;
export let market;
let graph;
const stock = 100;
const initialPrice = 100;
let ticks = 0;
let debugDiv;
main();
function main() {
    /**
     * Initialise:
     * - Canvas
     * - Market
     */
    // currently unsafe use of as - need to update to satisfies
    canvas = document.getElementById('canvas');
    const ctx = canvas.getContext("2d");
    // 1. Get the actual pixel size of the window/viewport
    const cssWidth = window.innerWidth; // 100vw
    const cssHeight = window.innerHeight * 0.5; // 50vh
    // 2. Set display size via CSS
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    // 3. Set actual resolution in memory (account for Pixel Density)
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssWidth * scale);
    canvas.height = Math.floor(cssHeight * scale);
    // 4. Normalize the coordinate system
    ctx?.scale(scale, scale);
    debugDiv = document.getElementById("debug");
    market = new Market(initialPrice, stock, 0.01);
    graph = new Graph(canvas, [], 10);
    graph.startCandle(initialPrice);
    /** Initialise Update */
    requestAnimationFrame(Update);
    //setInterval(Update, 10);
}
/**
 * Is called Every Frame
 * Unfixed refresh rate
 */
function Update() {
    /** Ticks per Candle */
    const TpC_input = document.getElementById("candle_size");
    const TpC = TpC_input.valueAsNumber;
    // NOTE: If orders are taken in the same frame they are created, you won't
    // see much on-screen. Consider drawing before takeOrder() or throttling it.
    for (let i = 0; i < stock; i++) {
        market.makeOrder(ticks);
    }
    debugDiv.innerText = `
    Total Orders: ${market.orderBook.orders.size} 
    Total Stock: ${market.orderBook.total}
    `;
    for (let i = 0; i < stock; i++) {
        market.takeOrder(ticks);
    }
    graph.updateCandle(market.lastPrice, ticks);
    if (ticks % TpC === 0) {
        graph.draw(market, ticks);
    }
    if (ticks % TpC == 0) {
        graph.startCandle(market.lastPrice);
    }
    ;
    ticks++;
    requestAnimationFrame(Update);
}
//# sourceMappingURL=main.js.map