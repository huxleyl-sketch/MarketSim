type candle = {
    min: number;
    max: number;
    open: number;
    close: number;
};
export declare class Graph {
    canvas: HTMLCanvasElement;
    liveCandle: candle;
    candles: candle[];
    /** Amount of candles visible */
    amt: number;
    constructor(canvas: HTMLCanvasElement, candles: candle[] | undefined, amt: number);
    startCandle(price: number): void;
    updateCandle(price: number): void;
    draw(): void;
    drawCandles(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number): void;
}
export {};
//# sourceMappingURL=graph.d.ts.map