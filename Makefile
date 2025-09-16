.PHONY: help install-puppeteer-deps build-shed test init-shed

help:
	echo "Hello"

install-puppeteer-deps:
	@./scripts/install-deps-for-puppeteer.sh

install:
	cd front && npm install

init-shed:
	@echo "🏠 Initializing Shed submodule..."
	git submodule update --init --recursive vendor/shed
	@echo "✅ Shed submodule initialized!"

build-shed:
	@echo "📦 Building Shed UMD bundle..."
	cd front && npm run build
	@echo "✅ Shed bundle built!"

test: init-shed build-shed
	cd front && npm test

clean:
	rm -rf front/node_modules
	rm -rf front/dist
