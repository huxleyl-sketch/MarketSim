export declare class Orderbook {
    /**
     *  All current orders in book.
     *  Map<price, {size,condition}>
     */
    orders: Map<number, {
        size: number;
        con: (price: number) => boolean;
    }>;
    /** Total amount of stock in orders */
    total: number;
    constructor();
    private add_order;
    /**
     * @param oPrice Order Price
     * @param oSize Order Size
     * @returns Trade Size, or -1 on failure
     */
    private remove_order;
    /** Adds an order at a Tick */
    tick_add(maxSize: number, lastPrice: number): void;
    tick_remove(maxSize: number): {
        price: number;
        size: number;
    } | undefined;
}
//# sourceMappingURL=order_book.d.ts.map