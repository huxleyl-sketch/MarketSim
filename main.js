//@ts-check
/**@typedef {({price: number, amt: number, time: number})} option */
/**@type {({buy:option[], sell:option[]})} */
let optionsBook = {
    buy: [
        { price: 100, amt: 20, time: 0 },
    ],
    sell : [
        { price: 100, amt: 20, time: 0 },
    ],
}
