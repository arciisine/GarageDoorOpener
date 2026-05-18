#!/bin/bash

echo -n "Saving $1 ... "
curl -XPOST "localhost:3000/garage/snapshot?img=$1" && echo 'success' || echo 'Failure'
rm -f $1