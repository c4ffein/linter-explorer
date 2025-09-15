use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Simple demo functions - real linting will be handled by the official Ruff WASM package in JS
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    log(&format!("Adding {} + {} in Rust!", a, b));
    a + b
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    log(&format!("Hello from Rust, {}!", name));
    format!("Hello from Rust, {}!", name)
}

#[wasm_bindgen]
pub fn demo_message() -> String {
    log("This WASM module demonstrates basic Rust functions. Python linting is handled by the official Ruff WASM package.");
    "Ready for Python linting with Ruff!".to_string()
}