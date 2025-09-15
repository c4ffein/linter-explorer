.PHONY: help install-puppeteer-deps build-wasm test

help:
	echo "Hello"

install-puppeteer-deps:
	@./scripts/install-deps-for-puppeteer.sh

build-wasm:
	cd front/wasm-math && wasm-pack build --target web

test: build-wasm
	cd front && npm test
