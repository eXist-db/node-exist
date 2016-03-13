#!/usr/bin/env sh
FOLDER=${HOME}/exist/${EXIST_DB_VERSION}
TARBALL_URL=https://github.com/eXist-db/exist/archive/${EXIST_DB_VERSION}.tar.gz

set -e
# check to see if exist folder is empty
if [ ! -d "$FOLDER" ]; then
  mkdir -p ${FOLDER}
  curl -L ${TARBALL_URL} | tar xz -C ${FOLDER} --strip-components=1
  cd ${FOLDER}
  ./build.sh
else
  echo "Using cached eXist DB instance: ${EXIST_DB_VERSION}."
fi
