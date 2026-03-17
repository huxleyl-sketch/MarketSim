import { Orderbook } from "./order_book.js";

const _maxOrderSize = 100;

export class Market {

    lastPrice: number;

    /** Total amount of Stock */
    stock: number;

    /** Percentage of stock that can be traded */
    stock_per_order: number

    orderBook: Orderbook;
    
    /**
     * 
     * @param initialPrice
     * @param stock 
     * @param stock_per_order Percentage of stock that can be traded
     * @param canvas 
     */
    constructor ( initialPrice: number, stock: number, stock_per_order: number ) {
        
        /** Initialising Default Values */
        this.lastPrice = initialPrice;
        this.stock = stock;
        this.stock_per_order = stock_per_order;

        /** Initialising the orderBook */
        this.orderBook = new Orderbook();

    }

    makeOrder ( currentTick: number ) {
        const remaining = Math.max(0, this.stock - this.orderBook.total);
        if (remaining <= 0) { return; }

        const amount = Math.min( _maxOrderSize, this.stock * this.stock_per_order, remaining / 2 );
        this.orderBook.tick_add( amount, this.lastPrice, currentTick );
    }

    takeOrder ( currentTick: number ) {
        let amount = Math.min( _maxOrderSize, this.stock * this.stock_per_order );
        let last = this.orderBook.tick_remove( amount, this.lastPrice, currentTick );
        
        if(last) this.lastPrice = last.price;
    }
}
