import { Orderbook } from "./order_book.js";
const _maxOrderSize = 100;
export class Market {
    lastPrice;
    /** Total amount of Stock */
    stock;
    /** Percentage of stock that can be traded */
    stock_per_order;
    orderBook;
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
        /** Initialising the orderBook */
        this.orderBook = new Orderbook();
    }
    makeOrder() {
        const remaining = Math.max(0, this.stock - this.orderBook.total);
        if (remaining <= 0) {
            return;
        }
        const amount = Math.min(_maxOrderSize, this.stock * this.stock_per_order, remaining / 2);
        this.orderBook.tick_add(amount, this.lastPrice);
    }
    takeOrder() {
        let amount = Math.min(_maxOrderSize, this.stock * this.stock_per_order);
        let last = this.orderBook.tick_remove(amount, this.lastPrice);
        if (last)
            this.lastPrice = last.price;
    }
}
//# sourceMappingURL=market.js.map