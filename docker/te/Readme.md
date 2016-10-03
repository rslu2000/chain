#Chain Core Testnet Edition
##Introduction
Chain Core TE is a docker container that runs `cored`
and a Java app that creates transactions on the testnet.
It is deployed to Heroku and used to load test.

##Quickstart
####Build the image
```
$ sh bin/build-ccte
```

####Deploy to Heroku
```
$ docker push registry.heroku.com/chain-core-ccte/web
```

####Run container locally
```
$ docker run -it -e PORT=8080 -e BLOCKCHAIN_ID="SOMEthing" -e GENERATOR_URL="else" --name ccte registry.heroku.com/chain-core-ccte/web
```

#####Enter the container
To receive a command prompt inside the container run:
```
$ docker exec -it <NAME> /bin/sh
```

#####Tail the logs
```
$ docker logs <NAME>
```

#####Stop the container
```
$ docker stop ccte
```
