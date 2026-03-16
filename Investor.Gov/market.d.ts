import { Orderbook } from "./order_book";
type candle = {
    min: number;
    max: number;
    open: number;
    close: number;
};
export declare class Market {
    lastPrice: number;
    /** Total amount of Stock */
    stock: number;
    /** Percentage of stock that can be traded */
    stock_per_order: number;
    sellBook: Orderbook;
    buyBook: Orderbook;
    /**
     *
     * @param initialPrice
     * @param stock
     * @param stock_per_order Percentage of stock that can be traded
     * @param canvas
     */
    constructor(initialPrice: number, stock: number, stock_per_order: number);
    makeOrder(): void;
    takeOrder(): void;
}
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
}
export {};
//# sourceMappingURL=market.d.ts.map