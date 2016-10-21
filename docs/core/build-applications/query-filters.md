# Query Filters

## Overview

Filters enable complex queries for retrieving lists of objects from Chain Core. A filter is composed of one or more **terms**, with multiple terms joined with AND and OR. Each term contains a **property**, **operator**, and **value**. Each term targets a specific field in the key-value (JSON) object (see [API Objects](../reference/api-objects.md)). Terms can be grouped together in a **scope** to target a specific array of sub-objects within an object.

For example, to list transactions where a specific account spends a specific asset, you would create a filter with two terms, scoped to the inputs:

```
inputs(account_alias='alice' AND asset_alias='gold')
```

## Properties

Each method accepts filters specific to the key-value (JSON) object returned. Any key can be used as a filter property. To use a key that is nested within other keys, provide the path to the object, including the parent objects. For example:

```
asset_definition.issuer.name='Acme'
```

## Operators

Filter terms currently support only the `=` operator.

## Scope

The transaction object is the only object that contains an array of other objects - an `inputs` array and an `outputs` array. The `inputs()` and `outputs()` scopes allow targeting a specific object within those arrays.

For example, the following will return transactions where Alice sent gold to Bob.

```
inputs(account_alias='alice' AND asset_alias='gold') AND outputs(account_alias='bob' AND asset_alias='gold')
```

## Queries

The following `QueryBuilder` classes support filters:

* `Transaction.QueryBuilder`
* `Account.QueryBuilder`
* `Asset.QueryBuilder`
* `UnspentOutput.QueryBuilder`
* `Balance.QueryBuilder`

### Note about Balance.QueryBuilder

Unlike other queries in Chain Core, balance queries do not return Chain Core objects, only simple sums over the `amount` fields in a specified list of unspent output objects. By default, the result is a single `amount`, but this can be subtotaled using a `sumBy` parameter in addition to the filter.

For example, to list all balances for `alice`, summed by `asset_alias`, you would set the following filter:

```
account_alias='alice'
```

and set `sumBy` to:

```
asset_alias
```

which will return the following:

```
[
    {
        "sum_by": {"asset_alias": "gold"},
        "amount": 10
    },
    {
        "sum_by": {"asset_alias": "silver"},
        "amount": 20
    }
]
```

## List transactions

`Transaction.QueryBuilder` retrieves transactions from the blockchain. By default, it returns a paginated list of all transactions, ordered by timestamp from latest to earliest. Queries can be customized using the following methods:

| Method             | Description                                                        |
|--------------------|--------------------------------------------------------------------|
| setStartTime       | Sets the latest transaction timestamp to include in results.       |
| setEndTime         | Sets the earliest transaction timestamp to include in results.     |
| setFilter          | Sets a filter on the results.                                      |
| addFilterParameter | Defines a value for the first undefined placeholder in the filter. |

### Examples

List all transactions involving Alice's account:

$code ../examples/java/QueryFilters.java list-alice-transactions

List all transactions involving the local Core:

$code ../examples/java/QueryFilters.java list-local-transactions
