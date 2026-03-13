//@ts-check

/**
 * type == true -> Buy Order
 * @typedef {({price: number, size: number})} Order
 * */

/**@type {(Order | undefined)[]} */
let buyBook = [];
/**@type {(Order | undefined)[]} */
let sellBook = [];


/**
 * @param {number} id 
 * @param {(Order | undefined)[]} book 
 * */
function change_Order(id, book){
    /**
     * Generate size
     * size :- [0, 200]
     */
    let size = 2 * 100 * Math.random();

    //order doesn't exist - Maker
    if(book[id] == undefined){
        
        /**
         * Generate price
         * price = 1 ± 0.01%
         */
        let price = quartiles.q2 * (1 + ( 2 * Math.random() - 1)/100);
        //add new order
        book[id] = {price, size};
        //console.log("change " + book[id].price + " " + book[id].size)
    }
    //change existing order - Taker
    else if(Math.abs((book[id].price - quartiles.q2)/(book[id].price + quartiles.q2)) <= 0.001){
        // if(book[id].size > size){
        //     book[id] = {
        //         //keep price
        //         price: book[id].price,
        //         //find difference in size
        //         size: book[id].size - size
        //     }
        // }
        // else{
            book[id] = undefined;
        //}
    }
    return book;
}

let find_Quartiles = () => {
    let values = buyBook
        .filter((o) => o !== undefined)
        .map((o) => o.price)
        .sort((a, b) => a - b);

    if (values.length === 0) {
        return { q1: undefined, q2: undefined, q3: undefined };
    }

    let quantile = (/** @type {number[]}*/ arr, /** @type {number}*/ q) => {
        let pos = (arr.length - 1) * q;
        let base = Math.floor(pos);
        let rest = pos - base;
        let next = arr[base + 1];
        return next !== undefined ? arr[base] + rest * (next - arr[base]) : arr[base];
    };

    return {
        q1: quantile(values, 0.25),
        q2: quantile(values, 0.5),
        q3: quantile(values, 0.75)
    };
}
