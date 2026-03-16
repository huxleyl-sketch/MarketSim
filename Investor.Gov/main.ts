import { Market } from "./market.js";
import { Graph } from "./market.js";


let canvas: HTMLCanvasElement;
export let market: Market;
let graph: Graph;
const stock = 10;
const initialPrice = 100;

let ticks = 0;

main();
function main(){
    
    /** 
     * Initialise:
     * - Canvas
     * - Market
     */

    // currently unsafe use of as - need to update to satisfies
    canvas = document.getElementById( 'canvas' ) as HTMLCanvasElement;
    market = new Market( initialPrice, stock, 0.01 );
    graph = new Graph( canvas, [], 10 );

    graph.startCandle( initialPrice );

    /** Initialise Update */
    requestAnimationFrame( Update );
}

/**
 * Is called Every Frame
 * Unfixed refresh rate
 */
function Update(){

    ticks++;
    
    for( let i = 0; i < stock; i++ ) {
        market.makeOrder();
    }
    for( let i = 0; i < stock; i++ ) {
        market.takeOrder();
    }
    graph.updateCandle(market.lastPrice);
    if (ticks % 4 === 0) {
        graph.draw();
    }

    //market.lastPrice += (Math.random() - 0.5) * 2;

    if(ticks % 10 == 0){ graph.startCandle( market.lastPrice ); };

    requestAnimationFrame(Update);
}
