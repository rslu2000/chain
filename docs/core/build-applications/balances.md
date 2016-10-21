# Balances

## Introduction

Any balance on the blockchain is simply a summation of unspent outputs. For example, the balance of Alice’s account is a summation of all the unspent outputs whose control program was created in Alice’s account.

The Balance.QueryBuilder class is unique in that it does not return an object in the Chain Core, but rather an aggregate sum over the `amount` fields in a defined list of unspent output objects.

**Sum By**

The `setSumBy` method enables more complex summations of balances. For example, if you have a network of counterparty-issued IOUs, you may wish to calculate the account balance of all IOUs from different counterparties that represent the same underlying currency.

By default, the Balance.QueryBuilder class sums balances by `asset_id` and `asset_alias`.


## Overview

This guide will walk you through a few basic balance queries:

* [List account balances](#list-account-balances)
* [Get asset circulation](#get-asset-circulation)
* [List account balances, summed by a field in the asset definition](#list-balances-with-sum_by)


### Sample Code

All of the code samples in this guide are extracted from a single, runnable Java file.
<a href="../examples/java/Balances.java" class="downloadBtn btn success" target="\_blank">View Sample Code</a>


## List account balances

List the asset IOU balances in Bank1's account:

$code ../examples/java/Balances.java account-balance

## Get asset circulation

Get the circulation of the Bank 1 USD IOU on the blockchain:

$code ../examples/java/Balances.java usd-iou-circulation

## List balances with sum_by

List the asset IOU balances in Bank1's account, summed by currency:

$code ../examples/java/Balances.java account-balance-sum-by-currency
