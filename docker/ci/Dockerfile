FROM golang:1.7.3-alpine

# rewrite repositories file
COPY repositories /etc/apk/repositories

# install dependencies
RUN apk --no-cache add bash clang git g++ make maven@edge nodejs@edge openjdk8 python perl postgresql

# copy contents of local bin into /usr/bin
ADD bin /usr/bin

ENV CHAIN $GOPATH/src/chain
ENV JAVA_HOME /usr/lib/jvm/java-1.8-openjdk
