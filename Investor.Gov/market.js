import { Orderbook } from "./order_book";
const _maxOrderSize = 100;
export class Market {
    lastPrice;
    /** Total amount of Stock */
    stock;
    /** Percentage of stock that can be traded */
    stock_per_order;
    sellBook;
    buyBook;
    /**
     *
     * @param initialPrice
     * @param stock
     * @param stock_per_order Percentage of stock that can be traded
     * @param canvas
     */
    constructor(initialPrice, stock, stock_per_order) {
        /** Initialising Default Values */
        this.lastPrice = initialPrice;
        this.stock = stock;
        this.stock_per_order = stock_per_order;
        /** Initialising the sellBook */
        this.sellBook = new Orderbook();
        this.sellBook.total = stock;
        /** Initialising the buyBook */
        this.buyBook = new Orderbook();
    }
    makeOrder() {
        let amount = Math.min(_maxOrderSize, this.stock * this.stock_per_order);
        this.buyBook.tick_add(amount);
        this.sellBook.tick_add(amount);
    }
    takeOrder() {
        let amount = Math.min(_maxOrderSize, this.stock * this.stock_per_order);
        this.buyBook.tick_remove(amount);
        this.sellBook.tick_remove(amount);
    }
}
export class Graph {
    canvas;
    liveCandle;
    candles;
    /** Amount of candles visible */
    amt;
    constructor(canvas, candles = [], amt) {
        this.canvas = canvas;
        this.candles = candles;
        this.amt = amt;
        this.liveCandle = { min: Infinity, max: 0, open: 0, close: 0 };
    }
    startCandle(price) {
        this.candles.push(this.liveCandle);
        this.liveCandle = {
            min: Infinity,
            max: 0,
            open: price,
            close: price,
        };
    }
    updateCandle(price) {
        this.liveCandle = {
            min: Math.min(price, this.liveCandle.min),
            max: Math.max(price, this.liveCandle.max),
            open: this.liveCandle.open,
            close: price,
        };
    }
    draw() {
        let ctx = this.canvas.getContext("2d");
        let width = this.canvas.width / this.amt;
        this.candles.forEach((candle, i) => {
            if (!ctx) {
                return;
            }
            ctx.fillStyle = candle.open < candle.close ? "green" : "red";
            ctx.beginPath();
            ctx.moveTo(width, candle.min);
            ctx.lineTo(width, candle.max);
            ctx.stroke();
            ctx.rect(width - width / 2, candle.open, width, candle.close - candle.open);
            ctx.fill();
        });
    }
}
//# sourceMappingURL=market.js.map