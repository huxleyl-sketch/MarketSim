import { Orderbook } from "./order_book.js";

const _maxOrderSize = 100;

export class Market {

    lastPrice: number;

    /** Total amount of Stock */
    stock: number;

    /** Percentage of stock that can be traded */
    stock_per_order: number

    sellBook: Orderbook;

    buyBook: Orderbook;
    
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

        /** Initialising the sellBook */
        this.sellBook = new Orderbook();
        //this.sellBook.total = stock;

        /** Initialising the buyBook */
        this.buyBook = new Orderbook();

    }

    makeOrder () {
        const remaining = Math.max(0, this.stock - (this.buyBook.total + this.sellBook.total));
        if (remaining <= 0) { return; }

        const amount = Math.min( _maxOrderSize, this.stock * this.stock_per_order, remaining / 2 );
        this.buyBook.tick_add( amount, this.lastPrice );
        this.sellBook.tick_add( amount, this.lastPrice );
    }

    takeOrder () {
        let amount = Math.min( _maxOrderSize, this.stock * this.stock_per_order );
        let buyLast = this.buyBook.tick_remove( amount, this.lastPrice );
        let sellLast = this.sellBook.tick_remove( amount, this.lastPrice );

        if ( buyLast && sellLast ) {
            const totalSize = buyLast.size + sellLast.size;
            this.lastPrice = (buyLast.price * buyLast.size + sellLast.price * sellLast.size) / totalSize;
        } else if ( buyLast ) {
            this.lastPrice = buyLast.price;
        } else if ( sellLast ) {
            this.lastPrice = sellLast.price;
        }
    }
}
