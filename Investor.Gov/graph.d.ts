import { Market } from "./market";
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
    draw(market: Market, currentTick: number): void;
    drawCandles(market: Market, ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, minPrice: number, priceSpan: number): void;
    drawOrders(market: Market, width: number, height: number, ctx: CanvasRenderingContext2D, currentTick: number, windowTicks: number, minPrice: number, priceSpan: number): void;
    private getPriceRange;
}
export {};
//# sourceMappingURL=graph.d.ts.map