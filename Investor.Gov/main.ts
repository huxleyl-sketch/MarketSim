import i_Market = require("./market");
import Graph = require("./market");


let canvas: HTMLCanvasElement;
export let market: i_Market.Market;
let graph: i_Market.Graph;
const stock = 1000;
const initialPrice = 100;

let ticks = 0;

function main(){
    
    /** 
     * Initialise:
     * - Canvas
     * - Market
     */

    // currently unsafe use of as - need to update to satisfies
    canvas = document.getElementById( 'canvas' ) as HTMLCanvasElement;
    market = new i_Market.Market( initialPrice, stock, 0.01 );
    graph = new i_Market.Graph( canvas, [], 10 );

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
    graph.draw();

    if(ticks % 10 == 0){ graph.startCandle( market.lastPrice ); };

    requestAnimationFrame(Update);
}