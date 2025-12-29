#!/bin/bash

echo -n "Saving $1 ... "
curl -XPOST localhost:3000/snapshot?img=$1 && echo 'success' || echo 'Failure'
if [[ -e "$1" ]]; then
  rm $1
fi