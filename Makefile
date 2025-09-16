.PHONY: help install-puppeteer-deps build-wasm test init-shed

help:
	echo "Hello"

install-puppeteer-deps:
	@./scripts/install-deps-for-puppeteer.sh

build-wasm:
	cd front/wasm-math && wasm-pack build --target web

init-shed:
	@echo "🏠 Initializing Shed submodule..."
	git submodule update --init --recursive vendor/shed
	@echo "✅ Shed submodule initialized!"

test: build-wasm init-shed
	cd front && npm test
