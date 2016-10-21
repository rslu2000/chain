# Queries

## Introduction

All data in Chain Core is stored as key-value JSON objects. This includes local objects, such as accounts and keys, and global objects, such as transactions and assets. To retrieve data, you perform a query with optional parameters. By default, each query returns a time-ordered list of objects beginning with the most recent.

### Filters
Filters allow narrowing results to a set of supplied parameters. You can target specific fields within each JSON object.

A filter is composed of one or more **terms**, with multiple terms joined with `AND` and `OR`. Each term contains a **property**, **operator**, and **value**. Each term targets a specific field in the key-value (JSON) object (see [API Objects](../reference/api-objects.md)). Terms can be grouped together in a **scope** to target a specific array of sub-objects within an object.

For example, to list transactions where a specific account spends a specific asset, you would create a filter with two terms, scoped to the inputs:

```
inputs(account_alias='alice' AND asset_alias='gold')
```

#### Properties

Any field in a JSON object can be used as a filter property. To use a field that is nested within other field, provide the path to the object, including the parent objects. For example:

```
asset_definition.issuer.name
```

#### Operators

Filters currently support only the `=` operator.

#### Scope

The transaction object is the only object that contains an array of other objects - an `inputs` array and an `outputs` array. The `inputs()` and `outputs()` scopes allow targeting a specific object within those arrays.

For example, the following will return transactions where Alice sent gold to Bob.

```
inputs(account_alias='alice' AND asset_alias='gold') AND outputs(account_alias='bob' AND asset_alias='gold')
```

### Additional Parameters

Transaction queries accept an additional set of time parameters to limit the results within a time window.

| Method             | Description                                                        |
|--------------------|--------------------------------------------------------------------|
| setStartTime       | Sets the latest transaction timestamp to include in results.       |
| setEndTime         | Sets the earliest transaction timestamp to include in results.     |

## Overview

This guide will walk you through several examples of queries:

* Transactions
* Assets
* Accounts
* Unspent Outputs
* Balances
* Keys

### Sample Code

All code samples in this guide are extracted from a single Java file.

<a href="../examples/java/Queries.java" class="downloadBtn btn success" target="\_blank">View Sample Code</a>

## Transactions
List all transactions involving Alice's account:

$code ../examples/java/Queries.java list-alice-transactions

List all transactions involving the local Core:

$code ../examples/java/Queries.java list-local-transactions

## Assets
## Accounts
## Unspent Outputs
## Balances
## Keys
