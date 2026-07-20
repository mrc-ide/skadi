#!/usr/bin/env bash
set -ex

ODIN_API_BRANCH=f45c724

docker run --pull=missing -d --name odin.api --rm -p 8001:8001 mrcide/odin.api:$ODIN_API_BRANCH

function cleanup() {
  set +x
  docker kill odin.api
}
trap cleanup EXIT

echo "Odin api online. Press Ctrl+C to teardown."
sleep infinity
