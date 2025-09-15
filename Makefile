help:
	echo "Hello"

install-puppeteer-deps:
	@./scripts/install-deps-for-puppeteer.sh

test:
	cd front && npm test
