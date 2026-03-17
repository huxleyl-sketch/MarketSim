import { Market } from "./market.js";
import { Graph } from "./graph.js";
let canvas;
export let market;
let graph;
const stock = 100;
const initialPrice = 100;
let ticks = 0;
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
    // This lets you draw using CSS pixel values (0 to cssWidth) 
    // while the engine handles the high-res scaling behind the scenes.
    ctx?.scale(scale, scale);
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
    ticks++;
    for (let i = 0; i < stock; i++) {
        market.makeOrder();
    }
    for (let i = 0; i < stock; i++) {
        market.takeOrder();
    }
    graph.updateCandle(market.lastPrice);
    if (ticks % TpC === 0) {
        graph.draw();
    }
    if (ticks % TpC == 0) {
        graph.startCandle(market.lastPrice);
    }
    ;
    requestAnimationFrame(Update);
}
//# sourceMappingURL=main.js.map