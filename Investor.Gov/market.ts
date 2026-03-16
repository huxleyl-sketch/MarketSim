type candle = { min: number, max : number, open: number, close: number }

const _maxOrderSize = 100;

class Market {

    lastPrice: number;

    /** Total amount of Stock */
    stock: number;

    sellBook: Orderbook;

    buyBook: Orderbook;
    
    graph: Graph;
    
    constructor (initialPrice: number, stock: number, canvas: HTMLCanvasElement) {
        
        /** Initialising Default Values */
        this.lastPrice = initialPrice;
        this.stock = stock;
        this.graph = new Graph(canvas,[],10);

        /** Initialising the sellBook */
        this.sellBook = new Orderbook();
        this.sellBook.total = stock;

        /** Initialising the buyBook */
        this.buyBook = new Orderbook();

    }
    addSellOrder () { this.sellBook.tickAdd( this.lastPrice,_maxOrderSize ); }
    removeSellOrder () { this.sellBook.tickRemove( _maxOrderSize ); }

    addBuyOrder(){ this.buyBook.tickAdd(this.lastPrice,_maxOrderSize); }
    removeBuyOrder () { this.buyBook.tickRemove( _maxOrderSize ); }
}

class Graph { 

    canvas: HTMLCanvasElement;

    liveCandle: candle;

    candles: candle[];

    /** Amount of candles visible */
    amt: number;


    constructor (canvas: HTMLCanvasElement, candles: candle[] = [], amt: number) {
        this.canvas = canvas;

        this.candles = candles;

        this.amt = amt;

        this.liveCandle = {min: Infinity, max: 0, open: 0, close: 0};
    }

    startCandle ( price: number ) {
        this.candles.push(this.liveCandle);

        this.liveCandle = {
            min: Infinity,
            max: 0,
            open: price,
            close: price,
        }
    }

    updateCandle ( price: number ){
        this.liveCandle = {
            min: Math.min(price,this.liveCandle.min),
            max: Math.max(price,this.liveCandle.max),
            open: this.liveCandle.open,
            close: price,
        }
    }

    draw(){

        let ctx = canvas.getContext("2d");
        let width = this.canvas.width / this.amt

        this.candles.forEach( ( candle, i ) => {
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

