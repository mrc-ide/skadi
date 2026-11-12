#!/usr/bin/env bash
set -ex

here=$(dirname $(realpath "$0"))
"$here"/run-deps-prod.sh

function cleanup() {
  set +x
  docker kill odin.api
}
trap cleanup EXIT

echo "Odin api online. Press Ctrl+C to teardown."
sleep infinity
