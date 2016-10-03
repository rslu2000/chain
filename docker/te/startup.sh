#!/bin/sh

mkdir -p ~/postgresql/data
initdb -D ~/postgresql/data
pg_ctl start -D ~/postgresql/data -w -l ~/postgresql/data/postgres.log
createdb core
psql core -f /schema.sql
# TODO(kr): if createdb call is successful,
# generate credentials, print to stdout, and
# save to ~/log/credentials.json

psmgr=/tmp/chain-psmgr
rm -f $psmgr
mkfifo $psmgr
(
	export DATABASE_URL=postgres://`whoami`:@127.0.0.1/core?sslmode=disable
	export LISTEN=:$PORT
	/corectl config $BLOCKCHAIN_ID $GENERATOR_URL
	/cored &
	cd /java && CLASSPATH=sdk.jar:. java Testnet
	echo 'cored' >$psmgr
) &

read exit_process <$psmgr
exit 1
