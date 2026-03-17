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
    draw(market, currentTick) {
        let ctx = this.canvas.getContext("2d");
        if (!ctx) {
            console.log("no Context");
            return;
        }
        let history = document.getElementById("history");
        this.amt = history.valueAsNumber;
        const tpcInput = document.getElementById("candle_size");
        const ticksPerCandle = tpcInput.valueAsNumber;
        const height = this.canvas.height / window.devicePixelRatio;
        const width = this.canvas.width / window.devicePixelRatio;
        ctx.clearRect(0, 0, width, height);
        const { minPrice, maxPrice } = this.getPriceRange(market, currentTick, this.amt * ticksPerCandle);
        if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
            return;
        }
        const priceSpan = Math.max(1, maxPrice - minPrice);
        // Draw orders as horizontal paths from creation tick to fill tick (or now).
        // This keeps historical order traces visible even after the order is taken.
        this.drawOrders(market, width, height, ctx, currentTick, this.amt * ticksPerCandle, minPrice, priceSpan);
        this.drawCandles(market, ctx, width, height, minPrice, priceSpan);
    }
    drawCandles(market, ctx, screenWidth, screenHeight, minPrice, priceSpan) {
        let width = screenWidth / this.amt;
        const visible = this.candles
            .slice(-this.amt)
            .filter(c => Number.isFinite(c.min) && Number.isFinite(c.max));
        if (visible.length === 0) {
            return;
        }
        const toY = (price) => screenHeight - ((price - minPrice) / priceSpan) * screenHeight;
        visible.forEach((candle, i) => {
            const x = i * width;
            ctx.fillStyle = ctx.strokeStyle = candle.open < candle.close ? "green" : "red";
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
    drawOrders(market, width, height, ctx, currentTick, windowTicks, minPrice, priceSpan) {
        const windowStart = Math.max(0, currentTick - windowTicks);
        const visible = market.orderBook.history.filter((o) => {
            const end = o.filledTick ?? currentTick;
            return o.createdTick <= currentTick && end >= windowStart;
        });
        if (visible.length === 0) {
            return;
        }
        let minSize = Infinity;
        let maxSize = 0;
        visible.forEach(o => {
            minSize = Math.min(o.size, minSize);
            maxSize = Math.max(o.size, maxSize);
        });
        const sizeSpan = Math.max(1, maxSize - minSize);
        const toY = (price) => height - ((price - minPrice) / priceSpan) * height;
        const toX = (tick) => ((tick - windowStart) / windowTicks) * width;
        visible.forEach(o => {
            // If you want true persistence without relying on history,
            // draw onto an offscreen canvas and composite here each frame.
            const startTick = Math.max(o.createdTick, windowStart);
            const endTick = Math.min(o.filledTick ?? currentTick, currentTick);
            if (endTick <= startTick) {
                return;
            }
            const opacity = (o.size - minSize) / sizeSpan;
            ctx.strokeStyle = o.above
                ? `rgba(0, 255, 0, ${opacity})`
                : `rgba(255, 0, 0, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(toX(startTick), toY(o.price));
            ctx.lineTo(toX(endTick), toY(o.price));
            ctx.stroke();
        });
    }
    getPriceRange(market, currentTick, windowTicks) {
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        const visibleCandles = this.candles
            .slice(-this.amt)
            .filter(c => Number.isFinite(c.min) && Number.isFinite(c.max));
        visibleCandles.forEach((c) => {
            minPrice = Math.min(minPrice, c.min);
            maxPrice = Math.max(maxPrice, c.max);
        });
        [...market.orderBook.orders.keys()].forEach((price) => {
            minPrice = Math.min(minPrice, price);
            maxPrice = Math.max(maxPrice, price);
        });
        const windowStart = Math.max(0, currentTick - windowTicks);
        market.orderBook.history.forEach((o) => {
            const end = o.filledTick ?? currentTick;
            if (o.createdTick <= currentTick && end >= windowStart) {
                minPrice = Math.min(minPrice, o.price);
                maxPrice = Math.max(maxPrice, o.price);
            }
        });
        return { minPrice, maxPrice };
    }
}
//# sourceMappingURL=graph.js.map