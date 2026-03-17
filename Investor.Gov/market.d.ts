import { Orderbook } from "./order_book.js";
export declare class Market {
    lastPrice: number;
    /** Total amount of Stock */
    stock: number;
    /** Percentage of stock that can be traded */
    stock_per_order: number;
    orderBook: Orderbook;
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
//# sourceMappingURL=market.d.ts.map