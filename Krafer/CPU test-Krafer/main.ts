const tradeAmt = 100;
let debug;
let ctx;
let canvas;
let candles = [];
let prevClose = 100;
const maxCandles = 60;
const candleGap = 4;

function main(){
    canvas = document.getElementById("canvas");
    ctx = canvas?.getContext("2d");
    debug = document.getElementById("debug");

    setInterval(loop, 1000/30);
}

function loop(){
    
   for(let i = 0; i < tradeAmt; i++){
        buyBook = change_Order(i,[...buyBook]);
        sellBook = change_Order(i,[...sellBook]);
    }
    
    render();
}

main();
