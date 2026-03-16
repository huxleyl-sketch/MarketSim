import { Orderbook } from "./order_book.js";
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
        const remaining = Math.max(0, this.stock - (this.buyBook.total + this.sellBook.total));
        if (remaining <= 0) {
            return;
        }
        const amount = Math.min(_maxOrderSize, this.stock * this.stock_per_order, remaining / 2);
        this.buyBook.tick_add(amount, this.lastPrice);
        this.sellBook.tick_add(amount, this.lastPrice);
    }
    takeOrder() {
        let amount = Math.min(_maxOrderSize, this.stock * this.stock_per_order);
        let buyLast = this.buyBook.tick_remove(amount, this.lastPrice);
        let sellLast = this.sellBook.tick_remove(amount, this.lastPrice);
        if (buyLast && sellLast) {
            const totalSize = buyLast.size + sellLast.size;
            this.lastPrice = (buyLast.price * buyLast.size + sellLast.price * sellLast.size) / totalSize;
        }
        else if (buyLast) {
            this.lastPrice = buyLast.price;
        }
        else if (sellLast) {
            this.lastPrice = sellLast.price;
        }
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
        if (this.candles.length > this.amt * 2) {
            this.candles = this.candles.slice(-this.amt * 2);
        }
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
        if (!ctx) {
            console.log("no Context");
            return;
        }
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const visible = this.candles
            .slice(-this.amt)
            .filter(c => Number.isFinite(c.min) && Number.isFinite(c.max));
        if (visible.length === 0) {
            return;
        }
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        visible.forEach((c) => {
            minPrice = Math.min(minPrice, c.min);
            maxPrice = Math.max(maxPrice, c.max);
        });
        const priceSpan = Math.max(1, maxPrice - minPrice);
        const toY = (price) => this.canvas.height - ((price - minPrice) / priceSpan) * this.canvas.height;
        visible.forEach((candle, i) => {
            const x = i * width;
            ctx.fillStyle = candle.open < candle.close ? "green" : "red";
            ctx.beginPath();
            ctx.moveTo(x, toY(candle.min));
            ctx.lineTo(x, toY(candle.max));
            ctx.stroke();
            const openY = toY(candle.open);
            const closeY = toY(candle.close);
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(1, Math.abs(openY - closeY));
            ctx.rect(x - width / 2, bodyTop, width, bodyHeight);
            ctx.fill();
        });
    }
}
//# sourceMappingURL=market.js.map