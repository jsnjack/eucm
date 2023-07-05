MANIFEST_TEMPLATE := manifest.template

VERSION=0.0.0
NAME:="eucm"
MONOVA:=$(shell which monova dot 2> /dev/null)
SCRIPT_CONFIG_CHROME:="\"service_worker\": \"background.js\""
SCRIPT_CONFIG_FIREFOX:="\"scripts\": [\"background.js\"]"

version:
ifdef MONOVA
override VERSION="$(shell monova)"
else
	$(info "Install monova (https://github.com/jsnjack/monova) to calculate version")
endif

render_manifest_chrome: version
	VERSION=${VERSION} SCRIPT_CONFIG=${SCRIPT_CONFIG_CHROME} envsubst < ${MANIFEST_TEMPLATE} > src/manifest.json

render_manifest_firefox: version
	VERSION=${VERSION} SCRIPT_CONFIG=${SCRIPT_CONFIG_FIREFOX} envsubst < ${MANIFEST_TEMPLATE} > src/manifest.json

build_firefox: render_manifest_firefox
	mkdir -p build
	rm -f build/${NAME}-$(VERSION)_firefox.zip
	./node_modules/.bin/web-ext build -s src/ -a build/

build_chrome: render_manifest_chrome
	mkdir -p build
	rm -f build/${NAME}-$(VERSION)_chrome.zip
	cd src && zip -r ../build/${NAME}-$(VERSION)_chrome.zip *

build: build_firefox build_chrome

run: render_manifest_firefox
	./node_modules/.bin/web-ext run -s src
