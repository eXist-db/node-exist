#!/usr/bin/env sh

set -e
# check to see if exist folder is empty
if [ ! -d "$HOME/exist-$EXIST_DB_VERSION" ]; then
  wget https://github.com/eXist-db/exist/archive/${EXIST_DB_VERSION}.tar.gz -O /tmp/${EXIST_DB_VERSION}.tar.gz
  cd $HOME
  tar -xvf /tmp/${EXIST_DB_VERSION}.tar.gz
  cd exist-${EXIST_DB_VERSION}
  ./build.sh
else
  echo "Using cached database instance."
fi
