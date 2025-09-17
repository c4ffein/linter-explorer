.PHONY: help install-puppeteer-deps build-shed test init-shed generate-references

help:
	@echo "make install-puppeteer-deps"
	@echo "make install"
	@echo "make init-shed"
	@echo "make build-shed"
	@echo "make generate-references"
	@echo "make test"
	@echo "make clean"

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

generate-references:
	@echo "🔧 Generating local tool reference outputs..."
	python scripts/format_local.py
	@echo "✅ Reference outputs generated in test_files/outputs/"

test: init-shed build-shed
	cd front && npm test

clean:
	rm -rf front/node_modules
	rm -rf front/dist
