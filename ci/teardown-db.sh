#!/usr/bin/env sh

set -e
if [ "${EXIST_DB_VERSION}" -eq "HEAD" ]; then
  echo "exclude HEAD from cache"
  rm -rf ${EXIST_DB_FOLDER}
else
  echo "reset data and logfiles for ${EXIST_DB_VERSION}"
  cd ${EXIST_DB_FOLDER}
  ./build.sh clean-default-data-dir
  rm webapp/WEB-INF/logs/*.log
fi
