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
     *  All current orders in book
     *  If  above - an order for a price above, price
     *  If !above - an order for a price below, price
     *  Map<price, {size, above}>
     */
    orders;
    /** History of orders for drawing from creation to fill */
    history;
    historyIndex;
    nextId;
    /** Total amount of stock in orders */
    total;
    constructor() {
        this.orders = new Map();
        this.total = 0;
        this.history = [];
        this.historyIndex = new Map();
        this.nextId = 1;
    }
    add_order(oPrice, oSize, isAbove, createdTick) {
        if (this.orders.has(oPrice))
            return;
        const id = this.nextId++;
        this.orders.set(oPrice, { size: oSize, above: isAbove, id, createdTick });
        this.historyIndex.set(id, this.history.length);
        this.history.push({ id, price: oPrice, size: oSize, above: isAbove, createdTick });
        this.total += oSize;
    }
    /**
     * @param oPrice Order Price
     * @param oSize Order Size
     * @returns Trade Size, or -1 on failure
     */
    remove_order(oPrice, oSize, tPrice, currentTick) {
        let order = this.orders.get(oPrice);
        if (!order) {
            return -1;
        }
        if (!order.above ? tPrice < oPrice : tPrice > oPrice) {
            return -1;
        }
        ;
        /** Traded Size */
        let tSize = Math.min(oSize, order.size);
        /** Remaining Size */
        let rSize = order.size - tSize;
        if (rSize <= 0) {
            this.orders.delete(oPrice);
            // Mark when the order is fully filled so we can draw a finite path.
            const idx = this.historyIndex.get(order.id);
            if (idx !== undefined) {
                const entry = this.history[idx];
                if (entry && entry.filledTick === undefined) {
                    entry.filledTick = currentTick;
                }
            }
        }
        else
            order.size = rSize; /** Updates the reference to order size */
        this.total -= tSize;
        return tSize;
    }
    /** Adds an order at a Tick */
    tick_add(maxSize, lastPrice, currentTick) {
        const r1 = Math.random();
        /** 5/1000 chance */
        if (r1 < 0.005) {
            /** oPrice :- [0.99 * lastPrice, 1.01 * lastPrice] */
            const r2 = Math.random();
            const radius = (2 * r2 - 1) / 100;
            let oPrice = lastPrice * (1 + radius);
            /** oSize :- [0,_maxOrderSize] */
            const r3 = Math.random();
            let oSize = r3 * maxSize;
            // Align order side with price relative to last price so it can execute
            const r4 = Math.random();
            let isAbove = r4 > 0.2 ? oPrice > lastPrice : oPrice < lastPrice;
            /** Doesn't Execute if oPrice already holds an Order */
            this.add_order(oPrice, oSize, isAbove, currentTick);
        }
    }
    tick_remove(maxSize, tPrice, currentTick) {
        const r1 = Math.random();
        let remaining = r1 * maxSize;
        let lastTrade;
        for (let price of this.orders.keys()) {
            const traded = this.remove_order(price, remaining, tPrice, currentTick);
            if (traded <= 0) {
                continue;
            }
            lastTrade = { price, size: traded };
            remaining -= traded;
            if (remaining <= 0) {
                return lastTrade;
            }
        }
        return lastTrade;
    }
}
//# sourceMappingURL=order_book.js.map