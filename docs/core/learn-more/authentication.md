# Authentication

## Introduction
There are two APIs in Chain Core: the **client API** and the **network API**.

The client API is used by the SDKs and the dashboard to communicate with Chain Core. The network API is used by [network operators](./blockchain-operators).

Each API is authenticated using access tokens with HTTP basic auth. For convenience, _**when accessing from localhost, neither API requires authentication**_.

### Creating access tokens
Both client and network access tokens are created in the dashboard. However, when deploying Chain Core to a non-local environment, you will not be able to access the dashboard, because you will not yet have a client access token. Therefore, you must use the **Corectl** command line tool to create your first client access token. After that, you can use that access token to login to the dashboard and create additional access tokens.

#### Install the Corectl command line tool

```bash
go install ./cmd/corectl
```

#### Create a client access token with Corectl
Run the following command:

```bash
corectl create-token [name]
```

which will return your access token:

```
name:secret
```
