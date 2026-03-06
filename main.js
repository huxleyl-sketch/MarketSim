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

  device.queue.writeBuffer(stock, 0, new Float32Array([100]));

  const bindGroup = device.createBindGroup({
    layout: makersPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buyBook } },
      { binding: 1, resource: { buffer: buyBookOut } },
      { binding: 2, resource: { buffer: sellBook } },
      { binding: 3, resource: { buffer: sellBookOut } },
      { binding: 4, resource: { buffer: stock } },
    ],
  });

  function dispatch(pipeline) {
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
    buffers: { buyBook, buyBookOut, sellBook, sellBookOut, stock },
    runMakers: () => dispatch(makersPipeline),
    runTakers: () => dispatch(takersPipeline),
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
};

let running = false;
let api = null;
let rafId = 0;

async function stepOnce() {
  if (!api) return;
  const t0 = performance.now();
  api.runMakers();
  api.runTakers();
  const [stock, buy, sell] = await Promise.all([
    api.readStock(),
    api.readBuyBook(),
    api.readSellBook(),
  ]);
  const t1 = performance.now();

  ui.stockValue.textContent = stock.toFixed(2);
  ui.buyCount.textContent = String(countSet(buy));
  ui.sellCount.textContent = String(countSet(sell));
  ui.stepMs.textContent = (t1 - t0).toFixed(2);
  ui.buyBook.textContent = formatPreview(buy);
  ui.sellBook.textContent = formatPreview(sell);
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
    api.writeStock(value);
  });

  await stepOnce();
}

main().catch((err) => {
  console.error(err);
  ui.status.textContent = "error";
});
