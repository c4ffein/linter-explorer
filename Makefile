.PHONY: help install-puppeteer-deps build-shed test init-shed

help:
	echo "Hello"

install-puppeteer-deps:
	@./scripts/install-deps-for-puppeteer.sh

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
