FROM alpine
RUN apk --no-cache add ca-certificates openjdk8-jre postgresql
COPY corectl cored schema.sql startup.sh ./
COPY java /java
CMD /startup.sh

# These commands are only used when running
# the container locally. Heroku does not
# expose any ports and runs the container
# as a random, non root user.
EXPOSE 8080
RUN adduser -S chain
USER chain
