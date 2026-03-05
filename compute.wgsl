//Makes options
struct Maker {
    stockAmt: u32,
}

//Takes options
struct Taker {
    stockAmt:f32,
}

struct Buy_Option {
    price:u32,
    size:u32,
}
struct Sell_Option {
    price:u32,
    size:u32,
}




@group(0) @binding(0) var<storage, read_write> buyBook : array<Buy_Option>;
@group(0) @binding(1) var<storage, read_write> buyBookOut  : array<Buy_Option>;

@group(0) @binding(2) var<storage, read_write> sellBook : array<Sell_Option>;
@group(0) @binding(3) var<storage, read_write> sellBookOut : array<Sell_Option>;


@group(0) @binding(4) var<storage, read_write> makers : array<Maker>;
@group(0) @binding(5) var<storage, read_write> takers : array<Taker>;

@group(0) @binding(6) var<storage, read_write> stock : array<u32>;

fn create_buy_option(_id : u32, _price : u32, _size : u32){
    //"I will buy for this price"
    //Add the option to the buy book

    buyBook[_id].price = _price;
    buyBook[_id].size = _size;
}

fn create_sell_option(_id : u32, _price : u32, _size : u32){
    //"I will sell for this price"
    //Add the option to the sell book

    sellBook[_id].price = _price;
    sellBook[_id].size = _size;
}

fn buy_option(_id: u32, _price : u32, _size : u32){
    //"I buy for that price"
    sellBookOut[_id] = true;
}
fn sell_option(_id: u32){
    //"I sell for that price"
    buyBookOut[_id] = true;
}

const makersLength : u32 = 1000;

@compute @workgroup_size(256)
fn run_makers(@builtin(global_invocation_id) id : vec3u){
    let i = id.x;

    if (i >= makersLength) { return; };
    let cur = makers[i];
    let r1 = rand01(i);
    let r2 = rand01(i * u32(r1 * 100));
    let r3 = rand01(i * u32(r2 * 100));

    //Generate price = stock * random :- [1.01,0.99]
    let price = u32( f32(stock[0]) * (1.0 + (r2 * 2.0 - 1.0)/100.0) );

    if (r1 > 0.5){
        if(cur.stockAmt > 0){
            //Create sell option

            //Generate size
            let size = u32( r3 * f32(cur.stockAmt) );

            create_sell_option(i, price, size);
        }
    }
    else{
        //Create buy option

        //Generate size
        let size = u32( r3 * 100.0 );

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

    let cur = takers[i];

    let r1 = rand01(i);
    let r2 = rand01(i * u32(r1 * 100));
    let r3 = rand01(i * u32(r2 * 100));

    if (r1 > 0.5){
        if(cur.stockAmt > 0){
            //Create sell option

            //Generate size
            let size = u32( r3 * f32(cur.stockAmt) );

            create_sell_option(i, price, size);
        }
    }
    else{
        //Create buy option

        //Generate size
        let size = u32( r3 * 100.0 );

        create_buy_option(i, price, size);
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

