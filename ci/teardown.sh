#!/usr/bin/env sh
FOLDER=${HOME}/exist/${EXIST_DB_VERSION}

set -e
if [ "${EXIST_DB_VERSION}" -eq "HEAD" ]; then
  echo "exclude HEAD from cache"
  rm -rf ${FOLDER}
else
  echo "reset data and logfiles for ${EXIST_DB_VERSION}"
  cd ${FOLDER}
  ./build.sh clean-default-data-dir
  rm -rf webapp/WEB-INF/logs/*.log
fi
