#!/usr/bin/env bash
set -ex

ODIN_API_BRANCH=3e85ab0

docker run --pull=missing -d --name odin.api --rm -p 8001:8001 mrcide/odin.api:$ODIN_API_BRANCH
