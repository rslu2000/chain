# Balances

## Introduction

Any balance on the blockchain is simply a summation of unspent outputs. For example, the balance of Alice’s account is a summation of all the unspent outputs whose control program was created from the keys in Alice’s account.

Unlike other queries in Chain Core, balance queries do not return Chain Core objects, only simple sums over the `amount` fields in a specified list of unspent output objects.

### Sum By

Balance sums are totalled by `asset_id` and `account_id` by default, but it is also possible to query more complex sums. For example, if you have a network of counterparty-issued IOUs, you may wish to calculate the account balance of all IOUs from different counterparties that represent the same underlying currency.

## Overview

This guide will walk you through a few basic balance queries:

* List account balances
* Get asset circulation
* List account balances, summed by a field in the asset definition

### Sample Code
All code samples in this guide are extracted from a single Java file.
<a href="../examples/java/Balances.java" class="downloadBtn btn success" target="\_blank">View Sample Code</a>


#### List the asset IOU balances in Bank1's account

#### Query

$code ../examples/java/Balances.java account-balance

#### Response

```
[
  {
    "sum_by": {
      "asset_id": "123",
      "asset_alias": "bank2_usd_iou"
    },
    "amount": 100
  },
  {
    "sum_by": {
      "asset_id": "123",
      "asset_alias": "bank3_usd_iou"
    },
    "amount": 200
  },
  {
    "sum_by": {
      "asset_id": "123",
      "asset_alias": "bank4_eur_iou"
    },
    "amount": 400
  },
  {
    "sum_by": {
      "asset_id": "123",
      "asset_alias": "bank5_eur_iou"
    },
    "amount": 500
  }
]
```

### Get the circulation of the Bank 1 USD IOU on the blockchain

#### Query

$code ../examples/java/Balances.java usd-iou-circulation

#### Response

```
[
  {
    "sum_by": {
      "asset_id": "123",
      "asset_alias": "bank1_usd_iou"
    },
    "amount": 500000
  }
]
```


### List the asset IOU balances in Bank1's account, summed by currency:

#### Query

$code ../examples/java/Balances.java account-balance-sum-by-currency

#### Response

```
[
  {
    "sum_by": {
      "asset_definition.currency": "USD"    // bank2_usd_iou + bank3_usd_iou, which both have a value of `USD` for `definition.tags.currency`
    },
    "amount": 300
  }
  {
    "sum_by": {
      "asset_definition.currency": "EUR"    // bank4_eur_iou + bank5_eur_iou, which both have a value of `EUR` for `definition.tags.currency`
    },
    "amount": 900
  }
]
```
