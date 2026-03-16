//@ts-check

class OrderBook {

    

    buyBook: Map<number,number>;
    sellBook: Map<number,number>;

    bestAsk: number;
    bestBid: number;

    

    totalBuyVolume: number;
    totalSellVolume: number;

    lastTradedPrice: number;

    market: Market;

    constructor ( market: Market ) {

        this.buyBook = new Map();
        this.sellBook = new Map();

        this.bestAsk = tradeAmt;
        this.bestBid = tradeAmt;

        this.totalBuyVolume = 0;
        this.totalSellVolume = 0;

        this.lastTradedPrice = 0;

        this.market = market;
    }

    PlaceOrder ( price: number, size: number, isBuy: boolean ) {
        if ( !( price > 0 && size > 0 ) ) { return; }

        if ( isBuy ) { 
            if ( ( this.sellBook.size > 0 && price > this.bestAsk ) )
                isBuy ? this.TakeSellOrder( price, size ) : this.TakeBuyOrder ( price, size );
            else 
                isBuy ? this.MakeBuyOrder( price, size ) : this.MakeSellOrder( price, size );
        } else {
            if ( this.buyBook.size > 0 && price < this.bestBid )
                isBuy ? this.TakeSellOrder( price, size ) : this.TakeBuyOrder ( price, size );
            else 
                isBuy ? this.MakeBuyOrder( price, size ) : this.MakeSellOrder( price, size );
        }
    }
    TakeSellOrder ( price: number, size: number) {
        /**Remaining Quantity */
        let rQuant = size;
        this.lastTradedPrice = this.market.lastPrice;

        while ( rQuant > 0 ) {
            if ( this.sellBook.size == 0) {
                this.bestAsk == Infinity;
                break;
            } 

            this.bestAsk = this.sellBook.keys().next().value ?? Infinity;

            if ( price < this.bestAsk ) break;

            /** Origional Quantity  */
            let aQuant = this.sellBook.get( this.bestAsk ) ?? -1;

            if ( aQuant > 0 ) {
                let tQuant = Math.min( aQuant, rQuant );

                /** Updated Quantity */
                let uQuant = aQuant - tQuant
                this.sellBook.set(this.bestAsk, uQuant);
                rQuant -= tQuant;
                this.totalBuyVolume -= tQuant;
                this.lastTradedPrice = this.bestAsk;

                this.market.updateCandle( this.bestAsk, tQuant );

                if(uQuant <= 0){
                    this.sellBook.delete(this.bestAsk);
                    this.bestAsk = this.sellBook.size > 0 ? this.sellBook.keys().next().value ?? Infinity : Infinity;
                }
            }
        }
    }

    TakeBuyOrder ( price: number, size: number ) {
        /**Remaining Quantity */
        let rQuant = size;
        this.lastTradedPrice = this.market.lastPrice;

        while ( rQuant > 0 ) {
            if ( this.buyBook.size == 0) {
                this.bestBid == Infinity;
                break;
            } 

            this.bestBid = this.buyBook.keys().next().value ?? Infinity;

            if ( price > this.bestBid ) break;

            /** Initial Quantity  */
            let aQuant = this.buyBook.get( this.bestBid ) ?? -1;

            if ( aQuant > 0 ) {
                /** Traded Quantity */
                let tQuant = Math.min( aQuant, rQuant );

                /** Updated Quantity */
                let uQuant = aQuant - tQuant;
                this.buyBook.set(this.bestBid, uQuant);

                rQuant -= tQuant;

                this.totalSellVolume -= tQuant;
                this.lastTradedPrice = this.bestBid;

                this.market.updateCandle( this.bestBid, tQuant );

                if(uQuant <= 0){
                    this.buyBook.delete(this.bestBid);
                    this.bestBid = this.buyBook.size > 0 ? this.buyBook.keys().next().value ?? Infinity : Infinity;
                }
            }
        }
    }

    MakeBuyOrder ( price: number, size: number ) {
        let curSize = this.buyBook.get(price) ?? 0;
        this.buyBook.set(price, curSize + size);
        this.totalBuyVolume += size;

        if ( price > this.bestBid ) this.bestBid = price;
    }

    MakeSellOrder ( price: number, size: number ) {
        let curSize = this.sellBook.get(price) ?? 0;
        this.sellBook.set(price, curSize + size);
        this.totalSellVolume += size;

        if ( price > this.bestAsk ) this.bestAsk = price;
    }
}

class OrderB {

    book: Map<number,number>;
    
    bestPrice: number;

    totalVolume: number;

    market: Market;

    constructor ( market: Market ) {
        this.book = new Map();
        this.bestPrice = tradeAmt;
        this.totalVolume = tradeAmt;
        this.market = market;
    }

    PlaceOrder ( price: number, size: number) {
        if ( !( price > 0 && size > 0 ) ) { return; }

        if ( ( this.book.size > 0 && price > this.bestPrice ) ) 
            this.TakeOrder( price, size );
        else 
            this.MakeOrder( price, size );
    }

    TakeOrder ( price: number, size: number ) {
        /**Remaining Quantity */
        let rQuant = size;

        while ( rQuant > 0 ) {
            if ( this.book.size == 0 ) {
                this.bestPrice == Infinity;
                break;
            } 

            this.bestPrice = this.book.keys().next().value ?? Infinity;

            if ( price < this.bestPrice ) break;

            /** Origional Quantity  */
            let aQuant = this.book.get( this.bestPrice ) ?? -1;

            if ( aQuant > 0 ) {
                let tQuant = Math.min( aQuant, rQuant );

                /** Update Quantity */
                let uQuant = aQuant - tQuant
                this.book.set(this.bestPrice, uQuant);

                rQuant -= tQuant;
                this.totalVolume -= tQuant;
                this.market.lastPrice = this.bestPrice;

                this.market.updateCandle( this.bestPrice, tQuant );

                if( uQuant <= 0 ) {
                    this.book.delete(this.bestPrice);
                    this.bestPrice = this.book.size > 0 ? this.book.keys().next().value ?? Infinity : Infinity;
                }
            }
        }
    }

    MakeOrder ( price: number, size: number ) {
        let curSize = this.book.get(price) ?? 0;
        this.book.set(price, curSize + size);
        this.totalVolume += size;

        if ( price > this.bestPrice ) this.bestPrice = price;
    }
}