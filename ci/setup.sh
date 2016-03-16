#!/usr/bin/env sh

# join some paths
FOLDER=${HOME}/exist/${EXIST_DB_VERSION}

set -e
# Is this version of existDB already cached? Meaning, the folder exists
if [ -d "$FOLDER" ]; then
  echo "Using cached eXist DB instance: ${EXIST_DB_VERSION}."
  exit 0
fi

# join some more
TARBALL_URL=https://github.com/eXist-db/exist/archive/${EXIST_DB_VERSION}.tar.gz

mkdir -p ${FOLDER}
curl -L ${TARBALL_URL} | tar xz -C ${FOLDER} --strip-components=1
cd ${FOLDER}
./build.sh
