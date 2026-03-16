type candle = { min: number, max : number, open: number, close: number }

class Market {

    lastPrice: number;

    liveCandle: candle;

    sellBook: Orderbook;

    buyBook: Orderbook;
    

    
    graph: { 
        canvas: HTMLCanvasElement,
        candles: candle[],
        width: number;
    };
    
    constructor (canvas: HTMLCanvasElement) {
        this.lastPrice = tradeAmt;

        this.liveCandle = {min: Infinity, max: 0, open: 0, close: 0};

        this.graph = {
            canvas,
            candles: [],
            width: 10,
        }
    }

    startCandle ( price: number ) {
        this.graph.candles.push(this.liveCandle);

        this.liveCandle = {
            min: Infinity,
            max: 0,
            open: price,
            close: price,
        }
    }

    updateCandle ( price: number, size: number ){
        this.liveCandle = {
            min: Math.min(price,this.liveCandle.min),
            max: Math.max(price,this.liveCandle.max),
            open: this.liveCandle.open,
            close: price,
        }
    }

    draw(){
        let canvas = this.graph.canvas;
        let width = this.graph.width;

        let ctx = canvas.getContext("2d");
        
        this.graph.candles.forEach( ( candle, i ) => {
            if(!ctx){ return;}

            ctx.fillStyle = candle.open < candle.close ? "green" : "red";

            ctx.beginPath();
            ctx.moveTo( width, candle.min );
            ctx.lineTo( width, candle.max );
            ctx.stroke();

            ctx.rect( width - width/2, candle.open, width, candle.close - candle.open );

            ctx.fill();
        });
        
    }
    
}

