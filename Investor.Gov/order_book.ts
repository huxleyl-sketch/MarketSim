/*
Order book is a list of pending orders - indefinate

Needs to transfer them to Market Orders - On some condition
*/

/* 
Generalising the principle that individual traders don't matter, iff, the trades and amount of stock are accounted for. 
This also includes, buy and sell orders, they are functionally equivalent, the only metric that matters is if they are limit orders or stop orders, on a market scale
*/

export class Orderbook {

    /**
     *  All current orders in book.
     *  Map<price, {size,condition}> 
     */
    orders: Map<number, {size:number , con: (price: number) => boolean}>;
    /** Total amount of stock in orders */
    total: number

    constructor ( ) {
        this.orders = new Map();
        this.total = 0;
    }

    private add_order ( oPrice: number, oSize: number, isAbove: boolean ) {
        if(this.orders.has(oPrice)) return;

        this.orders.set(oPrice, {
            size: oSize,
            /** traded price is either higher or lower than order price */
            con: isAbove ? (tPrice) => tPrice < oPrice : (tPrice) => tPrice > oPrice
        });

        this.total += oSize;
    }
    /**
     * @param oPrice Order Price
     * @param oSize Order Size
     * @returns Trade Size, or -1 on failure
     */
    private remove_order ( oPrice: number, oSize: number, tPrice: number ): number {

        let order = this.orders.get(oPrice);

        if ( !order ) { return -1; }
        
        if ( !order.con( tPrice ) ) { return -1; };

        /** Traded Size */
        let tSize = Math.min( oSize, order.size );

        /** Remaining Size */
        let rSize = order.size - tSize;

        if ( rSize <= 0 ) this.orders.delete( oPrice );
        else this.orders.set( oPrice, {size: rSize, con: order.con} );

        this.total -= tSize;

        return tSize;
    } 
    
    /** Adds an order at a Tick */
    tick_add (maxSize: number, lastPrice: number ) {
        const r1 = Math.random();

        /** 5/1000 chance */
        if ( r1 < 0.005 ) {

            /** oPrice :- [0.99 * lastPrice, 1.01 * lastPrice] */
            const r2 = Math.random();
            const radius = (2 * r2 - 1) / 100;
            let oPrice =  lastPrice * (1 + radius);

            /** oSize :- [0,_maxOrderSize] */
            const r3 = Math.random();
            let oSize = r3 * maxSize;

            // Align order side with price relative to last price so it can execute.
            let isAbove = oPrice > lastPrice;

            /** Doesn't Execute if oPrice already holds an Order */
            this.add_order( oPrice, oSize, isAbove );
        }
        
    }
    tick_remove ( maxSize: number, tPrice: number ): {price: number, size: number} | undefined{
        const r1 = Math.random();
        let remaining = r1 * maxSize;
        let lastTrade: {price: number, size: number} | undefined;

        for ( let price of this.orders.keys() ) {
            const traded = this.remove_order( price, remaining, tPrice );
            if ( traded <= 0 ) { continue; }

            lastTrade = { price, size: traded };
            remaining -= traded;

            if ( remaining <= 0 ) { return lastTrade; }
        }

        return lastTrade;
    }
}
