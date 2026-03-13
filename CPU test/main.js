const tradeAmt = 100;
let quartiles = {q1:100, q2:100, q3:100}
let debug;
let ctx;
let canvas;
let candles = [];
let prevClose = 100;
const maxCandles = 60;
const candleGap = 4;

function main(){
    canvas = document.getElementById("canvas");
    ctx = canvas?.getContext("2d");
    debug = document.getElementById("debug");

    setInterval(loop, 1000/30);
}

function loop(){
    
   for(let i = 0; i < tradeAmt; i++){
        buyBook = change_Order(i,[...buyBook]);
        sellBook = change_Order(i,[...sellBook]);
    }

    quartiles = find_Quartiles();
    pushCandle(quartiles);
    render();
}

function pushCandle(q){
    if(q.q1 === undefined || q.q2 === undefined || q.q3 === undefined){
        return;
    }
    let open = prevClose;
    let close = q.q2;
    let high = Math.max(q.q3, open, close);
    let low = Math.min(q.q1, open, close);
    prevClose = close;

    candles.push({open, high, low, close});
    if(candles.length > maxCandles){
        candles.shift();
    }
}

function render(){
    if(!ctx || !canvas){
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let padding = 16;
    let top = padding;
    let bottom = canvas.height - padding;
    let height = bottom - top;

    let bookWidth = Math.floor(canvas.width * 0.32);
    let candleLeft = padding + bookWidth + padding;
    let candleRight = canvas.width - padding;
    let candleWidth = candleRight - candleLeft;

    renderOrderBook(padding, top, bookWidth, height);
    renderCandles(candleLeft, top, candleWidth, height);
}

function renderCandles(left, top, chartW, chartH){
    if(candles.length === 0){
        return;
    }

    let min = Infinity;
    let max = -Infinity;
    for(let c of candles){
        if(c.low < min) min = c.low;
        if(c.high > max) max = c.high;
    }
    if(min === max){
        min -= 1;
        max += 1;
    }

    let right = left + chartW;
    let bottom = top + chartH;
    let candleW = Math.max(2, Math.floor(chartW / maxCandles) - candleGap);

    let priceToY = (p) => top + ((max - p) / (max - min)) * chartH;

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#444";
    ctx.strokeRect(left, top, chartW, chartH);

    for(let i = 0; i < candles.length; i++){
        let c = candles[i];
        let x = left + i * (candleW + candleGap) + candleGap;
        if(x + candleW > right){
            break;
        }
        let center = x + candleW / 2;
        let yHigh = priceToY(c.high);
        let yLow = priceToY(c.low);
        let yOpen = priceToY(c.open);
        let yClose = priceToY(c.close);

        ctx.strokeStyle = "#222";
        ctx.beginPath();
        ctx.moveTo(center, yHigh);
        ctx.lineTo(center, yLow);
        ctx.stroke();

        let up = c.close >= c.open;
        ctx.fillStyle = up ? "#2e7d32" : "#c62828";
        let yBody = Math.min(yOpen, yClose);
        let hBody = Math.max(1, Math.abs(yClose - yOpen));
        ctx.fillRect(x, yBody, candleW, hBody);
    }
}

function renderOrderBook(left, top, width, height){
    let right = left + width;
    let bottom = top + height;
    let center = left + Math.floor(width / 2);
    let maxLevels = 20;

    let buyLevels = buyBook
        .filter((o) => o !== undefined)
        .map((o) => ({price: o.price, size: o.size}))
        .sort((a, b) => b.price - a.price)
        .slice(0, maxLevels);

    let sellLevels = sellBook
        .filter((o) => o !== undefined)
        .map((o) => ({price: o.price, size: o.size}))
        .sort((a, b) => a.price - b.price)
        .slice(0, maxLevels);

    let min = Infinity;
    let max = -Infinity;
    for(let o of buyLevels){
        if(o.price < min) min = o.price;
        if(o.price > max) max = o.price;
    }
    for(let o of sellLevels){
        if(o.price < min) min = o.price;
        if(o.price > max) max = o.price;
    }
    if(!isFinite(min) || !isFinite(max)){
        min = 0;
        max = 1;
    }
    if(min === max){
        min -= 1;
        max += 1;
    }

    let maxSize = 1;
    for(let o of buyLevels){
        if(o.size > maxSize) maxSize = o.size;
    }
    for(let o of sellLevels){
        if(o.size > maxSize) maxSize = o.size;
    }

    let priceToY = (p) => top + ((max - p) / (max - min)) * height;
    let barMax = Math.max(4, Math.floor(width / 2) - 8);

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#444";
    ctx.strokeRect(left, top, width, height);
    ctx.strokeStyle = "#666";
    ctx.beginPath();
    ctx.moveTo(center, top);
    ctx.lineTo(center, bottom);
    ctx.stroke();

    for(let o of buyLevels){
        let y = priceToY(o.price);
        let w = Math.max(1, Math.floor((o.size / maxSize) * barMax));
        ctx.fillStyle = "#2e7d32";
        ctx.fillRect(center - w, y - 1, w, 2);
    }

    for(let o of sellLevels){
        let y = priceToY(o.price);
        let w = Math.max(1, Math.floor((o.size / maxSize) * barMax));
        ctx.fillStyle = "#c62828";
        ctx.fillRect(center, y - 1, w, 2);
    }
}

main();
