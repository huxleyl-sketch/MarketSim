
struct Buy_Option {
    is_set: u32,
    price:f32,
    size:u32,
}
struct Sell_Option {
    is_set: u32,
    price:f32,
    size:u32,
}




@group(0) @binding(0) var<storage, read_write> buyBook : array<Buy_Option>;
@group(0) @binding(1) var<storage, read_write> buyBookOut  : array<Buy_Option>;

@group(0) @binding(2) var<storage, read_write> sellBook : array<Sell_Option>;
@group(0) @binding(3) var<storage, read_write> sellBookOut : array<Sell_Option>;

@group(0) @binding(4) var<storage, read_write> stock : array<f32>;
struct SimParams {
    frame: u32,
    _pad0: u32,
    _pad1: u32,
    _pad2: u32,
};
@group(0) @binding(5) var<uniform> simParams : SimParams;

fn create_buy_option(_id : u32, _price : f32, _size : u32){
    //"I will buy for this price"
    //Add the option to the buy book
    if (buyBook[_id].is_set != 1){
        buyBook[_id].is_set = 1;
        buyBook[_id].price = _price;
        buyBook[_id].size = _size;
    }
}

fn create_sell_option(_id : u32, _price : f32, _size : u32){
    //"I will sell for this price"
    //Add the option to the sell book
    if (sellBook[_id].is_set != 1){
        sellBook[_id].is_set = 1;
        sellBook[_id].price = _price;
        sellBook[_id].size = _size;
    }
}

fn buy_option(_id: u32, _price : f32, _size : u32){
    //"I buy for that price"
    if (sellBook[_id].is_set == 1){
        sellBookOut[_id] = Sell_Option(0, _price, _size);
    }
}
fn sell_option(_id: u32, _price : f32, _size : u32){
    //"I sell for that price"
    if (buyBook[_id].is_set == 1){
        buyBookOut[_id] = Buy_Option(0, _price, _size);
    }
}

const makersLength : u32 = 1000;

@compute @workgroup_size(256)
fn run_makers(@builtin(global_invocation_id) id : vec3u){
    let i = id.x;

    if (i >= makersLength) { return; };
    let seed = i ^ simParams.frame;
    let r1 = rand01(seed ^ 0x9e3779b9u);
    let r2 = rand01(seed ^ 0x85ebca6bu);
    let r3 = rand01(seed ^ 0xc2b2ae35u);

    //Generate price = stock * random :- [1.01,0.99]
    let price = f32(stock[0]) * (1.0 + (r2 * 2.0 - 1.0)/100.0);
    let size = u32( r3 * 100.0 + 50.0);

    if (r1 < 0.2){
        //Create sell option
        create_sell_option(i, price, size);
    }
    else if (r1 > 0.2 && r1 < 0.4){
        //Create buy option
        create_buy_option(i, price, size);
    }
}

@compute @workgroup_size(256)
fn run_takers(@builtin(global_invocation_id) id : vec3u){

    //find an option
    //if is buy option
        //if has stock
            //sell stock at price
            //remove stock amt from trader[i].stockAmt
    //if is sell option
        //buy stock at price
        //add stock amt to trader[i].stockAmt

    let i = id.x;

    if (i >= makersLength) { return; };
    let seed = i ^ simParams.frame;
    let r1 = rand01(seed ^ 0x9e3779b9u);

    let size = u32( r1 * 100.0 + 50.0 );

    //check both buy and sell books against stock price
    let curPrice = stock[0];
    let curBuy = buyBook[i];
    let curSell = sellBook[i];
    if ((curPrice - curBuy.price) / curPrice < 0.01){
        buy_option(i,curBuy.price,clamp(curBuy.size,0,size));
    }
    if ((curPrice - curSell.price) / curPrice < 0.01){
        sell_option(i,curSell.price,curSell.size);
    }
    
}


fn hash_u32(x: u32) -> u32 {
  var v = x;
  v ^= v >> 16u;
  v *= 0x7feb352du;
  v ^= v >> 15u;
  v *= 0x846ca68bu;
  v ^= v >> 16u;
  return v;
}

fn rand01(seed: u32) -> f32 {
  return f32(hash_u32(seed)) * (1.0 / 4294967296.0);
}
