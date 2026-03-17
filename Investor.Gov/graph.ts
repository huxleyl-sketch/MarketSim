type candle = { min: number, max : number, open: number, close: number }

export class Graph { 

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
        if (this.candles.length > this.amt * 2) {
            this.candles = this.candles.slice(-this.amt * 2);
        }

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
        let ctx = this.canvas.getContext("2d");
        if (!ctx) { console.log("no Context"); return; }

        let history = document.getElementById("history") as HTMLInputElement;
        this.amt = history.valueAsNumber;
        const height = this.canvas.height / window.devicePixelRatio;
        const width = this.canvas.width / window.devicePixelRatio;
        ctx.clearRect(0, 0, width, height);

        this.drawCandles(ctx, width,height);
        //this.drawOrders(ctx, width, height);
    }

    drawCandles(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number){

        let width = screenWidth / this.amt;

        const toY = (price: number) =>
            screenHeight - ((price - minPrice) / priceSpan) * screenHeight;

        const visible = this.candles
        .slice(-this.amt)
        .filter(c => Number.isFinite(c.min) && Number.isFinite(c.max));
        if (visible.length === 0) { return; }

        let minPrice = Infinity;
        let maxPrice = -Infinity;
        visible.forEach((c) => {
            minPrice = Math.min(minPrice, c.min);
            maxPrice = Math.max(maxPrice, c.max);
        });

        const priceSpan = Math.max(1, maxPrice - minPrice);

        visible.forEach( ( candle, i ) => {
            const x = i * width;

            ctx.fillStyle = ctx.strokeStyle = candle.open < candle.close ? "green" : "red";

            ctx.beginPath();
            ctx.moveTo( x, toY(candle.min) );
            ctx.lineTo( x, toY(candle.max) );
            ctx.stroke();

            const openY = toY(candle.open);
            const closeY = toY(candle.close);
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(1, Math.abs(openY - closeY));

            ctx.rect( x - width/2, bodyTop, width, bodyHeight );

            ctx.fill();
        });
    }

}