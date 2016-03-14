#!/usr/bin/env sh
FOLDER=${HOME}/exist/${EXIST_DB_VERSION}

set -e
if [ "${EXIST_DB_VERSION}" -eq "HEAD" ]; then
  # exclude HEAD from cache
  rm -rf ${FOLDER}
else
  # reset logfiles for current version
  rm -rf ${FOLDER}/webapp/WEB-INF/logs/*.log
fi
