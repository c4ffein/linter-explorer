use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    log(&format!("Adding {} + {} in Rust!", a, b));
    a + b
}

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    log(&format!("Computing fibonacci({}) in Rust!", n));
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

#[wasm_bindgen]
pub fn is_prime(n: u32) -> bool {
    log(&format!("Checking if {} is prime in Rust!", n));
    if n < 2 {
        return false;
    }
    for i in 2..((n as f64).sqrt() as u32 + 1) {
        if n % i == 0 {
            return false;
        }
    }
    true
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    log(&format!("Hello from Rust, {}!", name));
    format!("Hello from Rust, {}!", name)
}