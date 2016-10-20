# Keys

## Introduction

Cryptographic private keys are the primary authorization mechanism on a blockchain. They control both the issuance and transfer of asset units. Each transaction must be signed


In a production environment, private keys are generated within an HSM (hardware security module) and their corresponding public keys are exported for use within Chain Core. In order to issue or transfer asset units on a blockchain, a transaction is created in Chain Core and sent to the HSM for signing. The HSM signs the transaction without ever revealing the private key. Once signed, the transaction can be successfully submitted to the blockchain.

For development environments, Chain Core provides a convenient MockHSM. The MockHSM API is identical to the HSM API in [Chain Core Enterprise Edition](https://chain.com/enterprise), providing a seamless transition from development to production.

## Overview

This guide will walk you through the basic key operations:

* Create key (in the MockHSM)
* Load key (into the HSM Signer)
* Sign a transaction (with the MockHSM)

### Source Code
All of the code examples in this guide are extracted from a single, runnable Java file.
<a href="../examples/java/Keys.java" class="downloadBtn btn success" target="_blank">View Source Code</a>

## Create key

## Signing transactions
