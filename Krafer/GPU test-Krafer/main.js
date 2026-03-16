//@ts-check

/**
 * WGSL structs in compute.wgsl:
 *   struct Buy_Option  { is_set: u32, price: f32, size: u32 }
 *   struct Sell_Option { is_set: u32, price: f32, size: u32 }
 * Storage buffer layout is tightly packed: 12 bytes per element.
 */

const MAKERS_LENGTH = 1000;
const OPTION_STRIDE_BYTES = 12; // u32 + f32 + u32
const WORKGROUP_SIZE = 256;
const READ_PREVIEW_COUNT = 12;

/** @typedef {{ is_set: number, price: number, size: number }} BuyOption */
/** @typedef {{ is_set: number, price: number, size: number }} SellOption */

/** Pack an array of options into a tightly packed ArrayBuffer (12 bytes/elem). */
function packOptions(options) {
  const buf = new ArrayBuffer(options.length * OPTION_STRIDE_BYTES);
  const view = new DataView(buf);
  for (let i = 0; i < options.length; i++) {
    const o = options[i];
    const base = i * OPTION_STRIDE_BYTES;
    view.setUint32(base + 0, o.is_set >>> 0, true);
    view.setFloat32(base + 4, o.price, true);
    view.setUint32(base + 8, o.size >>> 0, true);
  }
  return buf;
}

/** Unpack a tightly packed ArrayBuffer (12 bytes/elem) into JS objects. */
function unpackOptions(buf) {
  const view = new DataView(buf);
  const count = buf.byteLength / OPTION_STRIDE_BYTES;
  const out = new Array(count);
  for (let i = 0; i < count; i++) {
    const base = i * OPTION_STRIDE_BYTES;
    out[i] = {
      is_set: view.getUint32(base + 0, true),
      price: view.getFloat32(base + 4, true),
      size: view.getUint32(base + 8, true),
    };
  }
  return out;
}

async function initWebGPU() {
  if (!navigator.gpu) throw new Error("WebGPU not supported");

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("No GPU adapter");
  const device = await adapter.requestDevice();

  const wgsl = await (await fetch("compute.wgsl")).text();
  const module = device.createShaderModule({ code: wgsl });

  const makersPipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module, entryPoint: "run_makers" },
  });

  const takersPipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module, entryPoint: "run_takers" },
  });

  const buyBook = device.createBuffer({
    size: MAKERS_LENGTH * OPTION_STRIDE_BYTES,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  });
  const buyBookOut = device.createBuffer({
    size: MAKERS_LENGTH * OPTION_STRIDE_BYTES,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  });
  const sellBook = device.createBuffer({
    size: MAKERS_LENGTH * OPTION_STRIDE_BYTES,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  });
  const sellBookOut = device.createBuffer({
    size: MAKERS_LENGTH * OPTION_STRIDE_BYTES,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  });
  const stock = device.createBuffer({
    size: 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  });
  const simParams = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(stock, 0, new Float32Array([100]));

  const makersBindGroup = device.createBindGroup({
    layout: makersPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buyBook } },
      { binding: 2, resource: { buffer: sellBook } },
      { binding: 4, resource: { buffer: stock } },
      { binding: 5, resource: { buffer: simParams } },
    ],
  });

  const takersBindGroup = device.createBindGroup({
    layout: takersPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buyBook } },
      { binding: 1, resource: { buffer: buyBookOut } },
      { binding: 2, resource: { buffer: sellBook } },
      { binding: 3, resource: { buffer: sellBookOut } },
      { binding: 4, resource: { buffer: stock } },
      { binding: 5, resource: { buffer: simParams } },
    ],
  });

  function dispatch(pipeline, bindGroup) {
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(MAKERS_LENGTH / WORKGROUP_SIZE));
    pass.end();
    device.queue.submit([encoder.finish()]);
  }

  async function readBuffer(buffer, size) {
    const readback = device.createBuffer({
      size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(buffer, 0, readback, 0, size);
    device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    const copy = readback.getMappedRange().slice(0);
    readback.unmap();
    return copy;
  }

  async function readBuyBook() {
    const buf = await readBuffer(buyBook, MAKERS_LENGTH * OPTION_STRIDE_BYTES);
    return unpackOptions(buf);
  }

  async function readSellBook() {
    const buf = await readBuffer(sellBook, MAKERS_LENGTH * OPTION_STRIDE_BYTES);
    return unpackOptions(buf);
  }

  async function readStock() {
    const buf = await readBuffer(stock, 4);
    return new Float32Array(buf)[0];
  }

  function writeBuyBook(options) {
    const buf = packOptions(options);
    device.queue.writeBuffer(buyBook, 0, buf);
  }

  function writeSellBook(options) {
    const buf = packOptions(options);
    device.queue.writeBuffer(sellBook, 0, buf);
  }

  function writeStock(value) {
    device.queue.writeBuffer(stock, 0, new Float32Array([value]));
  }

  return {
    device,
    buffers: { buyBook, buyBookOut, sellBook, sellBookOut, stock, simParams },
    runMakers: () => dispatch(makersPipeline, makersBindGroup),
    runTakers: () => dispatch(takersPipeline, takersBindGroup),
    readBuyBook,
    readSellBook,
    readStock,
    writeBuyBook,
    writeSellBook,
    writeStock,
  };
}

function formatPreview(options) {
  return options
    .slice(0, READ_PREVIEW_COUNT)
    .map((o, i) => {
      const flag = o.is_set ? "set" : "-";
      return `${String(i).padStart(3, " ")} | ${flag} | ${o.price.toFixed(2).padStart(8, " ")} | ${String(o.size).padStart(5, " ")}`;
    })
    .join("\n");
}

function countSet(options) {
  let n = 0;
  for (let i = 0; i < options.length; i++) {
    if (options[i].is_set) n++;
  }
  return n;
}

const ui = {
  status: document.getElementById("status"),
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  stepBtn: document.getElementById("stepBtn"),
  stockInput: document.getElementById("stockInput"),
  setStockBtn: document.getElementById("setStockBtn"),
  stockValue: document.getElementById("stockValue"),
  buyCount: document.getElementById("buyCount"),
  sellCount: document.getElementById("sellCount"),
  stepMs: document.getElementById("stepMs"),
  buyBook: document.getElementById("buyBook"),
  sellBook: document.getElementById("sellBook"),
  candleCanvas: document.getElementById("candleCanvas"),
  candleStatus: document.getElementById("candleStatus"),
};

let running = false;
let api = null;
let rafId = 0;
let frame = 0;
let stockValue = 100;
let uiFrame = 0;
const UI_EVERY_N_FRAMES = 8;
const HISTORY_WINDOW = 200;
let priceHistory = [100];
let candles = [];
let currentCandle = null;
let lastBuyBook = [];
let lastSellBook = [];

const MAX_CANDLES = 80;

function newCandle(price) {
  return { open: price, high: price, low: price, close: price };
}

function updateCandle(price) {
  if (!currentCandle) currentCandle = newCandle(price);
  currentCandle.close = price;
  currentCandle.high = Math.max(currentCandle.high, price);
  currentCandle.low = Math.min(currentCandle.low, price);
}

function commitCandle() {
  if (!currentCandle) return;
  candles.push(currentCandle);
  if (candles.length > MAX_CANDLES) candles.shift();
  currentCandle = null;
}

function drawCandles() {
  const canvas = ui.candleCanvas;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const all = currentCandle ? [...candles, currentCandle] : candles.slice();
  if (all.length === 0) return;

  let min = Infinity;
  let max = -Infinity;
  for (const c of all) {
    min = Math.min(min, c.low);
    max = Math.max(max, c.high);
  }
  if (min === max) {
    min -= 1;
    max += 1;
  }

  const pad = 16;
  const chartW = width - pad * 2;
  const chartH = height - pad * 2;
  const candleW = Math.max(4, Math.floor(chartW / all.length) - 4);
  const gap = Math.floor((chartW / all.length) - candleW);

  const yFor = (price) => {
    const t = (price - min) / (max - min);
    return pad + chartH - t * chartH;
  };

  // axis
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, pad + chartH);
  ctx.lineTo(pad + chartW, pad + chartH);
  ctx.stroke();

  // Order book lines (draw first so candles sit on top)
  const drawOrderLines = (orders, color) => {
    if (!orders || orders.length === 0) return;
    let maxSize = 1;
    for (let i = 0; i < orders.length; i++) {
      if (orders[i].is_set && orders[i].size > maxSize) maxSize = orders[i].size;
    }
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      if (!o.is_set) continue;
      const y = yFor(o.price);
      const alpha = Math.min(0.9, 0.15 + (o.size / maxSize) * 0.75);
      ctx.strokeStyle = `rgba(${color}, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(pad + chartW, y);
      ctx.stroke();
    }
  };

  drawOrderLines(lastBuyBook, "16, 112, 92");  // teal-ish
  drawOrderLines(lastSellBook, "185, 28, 28"); // red-ish

  for (let i = 0; i < all.length; i++) {
    const c = all[i];
    const x = pad + i * (candleW + gap) + gap / 2;
    const yOpen = yFor(c.open);
    const yClose = yFor(c.close);
    const yHigh = yFor(c.high);
    const yLow = yFor(c.low);

    const isUp = c.close >= c.open;
    ctx.strokeStyle = isUp ? "#0f766e" : "#b42318";
    ctx.fillStyle = isUp ? "#99f6e4" : "#fecaca";
    ctx.lineWidth = 2;

    // wick
    ctx.beginPath();
    ctx.moveTo(x + candleW / 2, yHigh);
    ctx.lineTo(x + candleW / 2, yLow);
    ctx.stroke();

    // body
    const top = Math.min(yOpen, yClose);
    const bottom = Math.max(yOpen, yClose);
    const bodyH = Math.max(2, bottom - top);
    ctx.fillRect(x, top, candleW, bodyH);
    ctx.strokeRect(x, top, candleW, bodyH);
  }

  ui.candleStatus.textContent = `${candles.length} bars`;
}

async function stepOnce() {
  if (!api) return;
  const t0 = performance.now();
  api.device.queue.writeBuffer(api.buffers.simParams, 0, new Uint32Array([frame, 0, 0, 0]));
  api.writeStock(stockValue);
  api.runMakers();
  api.runTakers();
  frame++;
  uiFrame++;

  // Candle update is tied to each frame draw using CPU-side stockValue.
  updateCandle(stockValue);
  commitCandle();
  updateCandle(stockValue);
  drawCandles();

  if (uiFrame % UI_EVERY_N_FRAMES === 0) {
    const [buy, sell] = await Promise.all([
      api.readBuyBook(),
      api.readSellBook(),
    ]);
    const t1 = performance.now();

    lastBuyBook = buy;
    lastSellBook = sell;

    let bestBuy = -Infinity;
    let bestSell = Infinity;
    for (let i = 0; i < buy.length; i++) {
      const o = buy[i];
      if (o.is_set && o.price > bestBuy) bestBuy = o.price;
    }
    for (let i = 0; i < sell.length; i++) {
      const o = sell[i];
      if (o.is_set && o.price < bestSell) bestSell = o.price;
    }

    let mid = stockValue;
    const hasBuy = bestBuy > -Infinity;
    const hasSell = bestSell < Infinity;
    if (hasBuy && hasSell) {
      mid = (bestBuy + bestSell) / 2;
    } else if (hasBuy) {
      mid = bestBuy;
    } else if (hasSell) {
      mid = bestSell;
    }

    priceHistory.push(mid);
    if (priceHistory.length > HISTORY_WINDOW) priceHistory.shift();
    const sum = priceHistory.reduce((acc, v) => acc + v, 0);
    stockValue = sum / priceHistory.length;
    api.writeStock(stockValue);

    ui.stockValue.textContent = stockValue.toFixed(2);
    ui.buyCount.textContent = String(countSet(buy));
    ui.sellCount.textContent = String(countSet(sell));
    ui.stepMs.textContent = (t1 - t0).toFixed(2);
    ui.buyBook.textContent = formatPreview(buy);
    ui.sellBook.textContent = formatPreview(sell);

    drawCandles();
  }
}

async function loop() {
  if (!running) return;
  await stepOnce();
  rafId = requestAnimationFrame(loop);
}

function setRunning(value) {
  running = value;
  ui.status.textContent = running ? "running" : "idle";
  ui.startBtn.disabled = running;
  ui.stopBtn.disabled = !running;
}

async function main() {
  api = await initWebGPU();
  // @ts-ignore
  window.gpuSim = api;
  stockValue = Number(ui.stockInput.value || 100);
  priceHistory = [stockValue];
  api.writeStock(stockValue);
  updateCandle(stockValue);
  drawCandles();

  ui.startBtn.addEventListener("click", () => {
    if (running) return;
    setRunning(true);
    loop();
  });

  ui.stopBtn.addEventListener("click", () => {
    setRunning(false);
    if (rafId) cancelAnimationFrame(rafId);
  });

  ui.stepBtn.addEventListener("click", async () => {
    await stepOnce();
  });

  ui.setStockBtn.addEventListener("click", () => {
    const value = Number(ui.stockInput.value || 0);
    stockValue = value;
    priceHistory = [stockValue];
    api.writeStock(stockValue);
  });

  await stepOnce();
}

main().catch((err) => {
  console.error(err);
  ui.status.textContent = "error";
});
