# Blockchain Programs

* [Introduction](#introduction)
* [Chain Virtual Machine](#chain-virtual-machine)
* [Ivy](#ivy)
  * [Predicates](#predicates)
  * [Contracts](#contracts)
* [Programs](#programs)
  * [Control programs](#control-programs)
  * [Issuance programs](#issuance-programs)
  * [Consensus programs](#consensus-programs)
  * [Signature programs](#signature-programs)
* [Contract Examples](#contract-examples)
  * [Offers and order books](#offers-and-order-books)
  * [Singleton](#singleton)
  * [Private Contracts](#private-contracts)


## Introduction

Chain Protocol enables flexible control over assets by supporting custom logic at three levels:

* **Issuance programs**, that specify the rules for issuing new units of an asset.
* **Control programs**, that specify the rules for spending existing units of an asset.
* **Consensus programs**, that specify the rules for accepting new blocks.

Each program authenticates the data structure in which it is used. Programs run deterministically, use capped memory and time requirements, and can be evaluated in parallel.

Programs are flexible enough to allow implementing:

* a wide range of financial instruments (such as options, bonds, and swaps), 
* sophisticated security schemes for holding assets,
* and “smart contract” applications such as offers, order books, and auctions.

This document discusses design and use cases for custom programs on the blockchain.

## Chain Virtual Machine

A program is written in bytecode — instructions for the Chain Virtual Machine (CVM). The CVM is a stack machine: each instruction performs operations on a *data stack*, usually working on the items on top of the stack. All items on the data stack are strings of bytes, although some instructions convert them to and from numbers or booleans in order to perform operations on them. The CVM also has an *alt stack* to simplify stack manipulation.

[sidenote]

Bitcoin, similarly, uses programs as predicates in order to determine whether a given state transition — encoded in a transaction — is authorized. This is different from Ethereum’s approach, in which programs directly compute the resulting state.

[/sidenote]

### Run limit

The CVM’s instruction set is Turing complete. To prevent unbounded use of computational resources, the protocol allows networks to set a *run limit* that a program is not allowed to exceed. Each instruction consumes some of the limit as it runs, according to its *run cost*. Processing-intensive instructions, such as signature checks, are more expensive.

The run cost also takes into account the stack's current memory usage. Adding an item to the stack has a cost based on the size of the item; removing an item from the stack refunds that cost.

[sidenote]

Both Bitcoin and Ethereum have restrictions that prevent program execution from using excessive time or memory. Chain’s run limit mechanism is similar to Ethereum’s “gas,” except that there is no on-chain accounting for the execution cost of a transaction.

[/sidenote]

### Instruction Set

The CVM has some overlaps and similarities with Bitcoin Script, but adds instructions to support additional functionality, including loops, state transitions (through transaction introspection), and program evaluation.

What follows is a summary of the functionality provided by CVM instructions. For a complete list and more precise definitions, see the [VM specification](../specifications/vm1.md).

#### Stack manipulation

Programs may encode bytestrings to push on data stack using a range of `PUSHDATA` instructions. Instructions `DROP`, `DUP`, `SWAP`, `PICK` and others allow moving stack items around. More complex stack manipulations can be assisted by `TOALTSTACK` and `FROMALTSTACK` instructions that move items between the data stack and an auxilliary alt stack.

#### String manipulation

`EQUAL` checks for the equality of two strings. `CAT`, `SUBSTR`, `LEFT`, and `RIGHT` perform operations on strings from the top of the stack. `AND`, `OR`, `XOR` perform bitwise operations.

#### Arithmetic operations

While all items on the stack are strings, some instructions interpret items as numbers, using 64-bit two's complement representation.

CVM deterministically checks for overflows: if the result overflows (e.g. too large numbers are multiplied), execution immediately fails.


#### Boolean operations

Items on the stack can also be interpreted as booleans. Empty strings and strings consisting of zero bytes are coerced to `false`, all others are coerced to `true`.

#### Cryptographic operations

The `SHA256` and `SHA3` instructions execute corresponding hash functions and output 32-byte strings.

The `CHECKSIG` instruction checks the validity of an Ed25519 signature against a given public key and a message hash.

[sidenote]

While similar to Bitcoin instructions, `CHECKSIG` and `CHECKMULTISIG` are generalized to accept an arbitrary message hash. This enables integration with external authoritative data sources and, more importantly, [signature programs](#signature-programs) discussed below.

[/sidenote]

`CHECKMULTISIG` checks an “M-of-N” signing condition using `M` signatures and `N` public keys.

#### Control flow instructions

`VERIFY` pops the top value from the data stack and checks if it is `true`. If it is not, or if there is no top value, the entire program fails.

`JUMPIF` conditionally jumps to another part of the code, based on the current value on top of the stack. This can be used to implement conditionals and loops.

`CHECKPREDICATE` executes a program (written in CVM bytecode) in a separate VM instance. Nested executions are allowed, but the depth is capped by memory cost that is subtracted from the available run limit and refunded when the nested VM instance completes execution.

#### Introspection instructions

The CVM provides operations that, when used in a control or issuance program, introspect parts of a transaction attempting to spend that output. 

[sidenote]

The EVM includes many opcodes that provide introspection into the execution environment, including the global mutable state.

In contrast, CVM allows introspection only of the immutable data declared in the transaction, similar to Bitcoin’s `CHECKLOCKTIMEVERIFY` and `CHECKSEQUENCEVERIFY` instructions that check absolute and relative transaction lock times, respectively.

[/sidenote]

`CHECKOUTPUT` allows an input to introspect the outputs of the transaction. This allows it to place restrictions on how the input values are subsequently used. This instruction provides functionality similar to the `CHECKOUTPUTVERIFY` opcode proposed by Malte Möser, Ittay Eyal, and Emin Gün Sirer in their [Bitcoin Covenants](http://fc16.ifca.ai/bitcoin/papers/MES16.pdf) paper. `CHECKOUTPUT` also allows implementing arbitrary state-machines within a UTXO model as was proposed earlier by Oleg Andreev in [Pay-to-Contract](https://github.com/oleganza/bitcoin-papers/blob/master/SmartContractsSoftFork.md) paper.

`MINTIME` and `MAXTIME` allow limitations on when a UTXO can be spent. `AMOUNT`, `ASSET`, `PROGRAM`, `REFDATAHASH`, and `INDEX` allow a control program to introspect the input itself.

## Ivy

Chain is developing a high-level language, *Ivy*, that compiles to CVM bytecode, to make it easier to write safe programs. Ivy is still evolving, and this explanation and tutorial is provided only to help ground the examples used below.

[sidenote]

Similarly, most development for the EVM is done using [Solidity](https://solidity.readthedocs.io/en/develop/), a high-level language that has been compared to JavaScript. While Ivy and Solidity have some similarities in syntax, they have very different semantics. Solidity can be roughly classified as an object-oriented imperative language, while Ivy fits better into the paradigm of a *declarative language*, though it has some imperative elements. This reflects the design differences between Ethereum's and Chain's transaction models. 

[/sidenote]

### Predicates

*Predicates* in Ivy are programs that either return true or false. 

```
predicate example() {
	// comments start with two slashes
	// this predicate would return true by default, since there is nothing to cause it to fail
}
```

Ivy supports the same arithmetic, logical, cryptographic, and string operations as the CVM, but uses more familiar infix and function-call syntax, such as `2 + 2`, `4 > 5`, or `sha3("foobar")`.

Most of the action in Ivy programs happens in *verify statements*, which halt execution if the given expression evaluates to false.

```
predicate verifyExample() { 
	verify 4 + 5 > 2 * 3;
}
```

Predicates can use *assignment statements* to assign values to named variables:

```
predicate assignmentExample() {
	x = 4 + 5;
	y = 6 + 2;

	// multiple assigment
	(x, y) = (y, x);

	verify x < y;
}
```

Predicates may take named *arguments*:

```
predicate argumentExample(x) { 
	verify x > 5; 
	verify x < 10;
}
```

Predicates can take other predicates as arguments, and evaluate them with given arguments:

```
predicate evaluatePredicateExample(pred) {
	verify pred(5);
}
```

Predicates can take variable numbers of arguments:

```
predicate listExample(pred, m, ...args[m]) {
	verify pred(args...);
}
```

Predicates in a control or issuance program may introspect aspects of the current transaction by accessing the global `tx` variable:

```
predicate introspectExample(targetOutputIndex, targetAssetID, targetControlProgram) {
	verify tx.mintime > 1477267200;

	// verify that 5 units of some asset are sent to a particular control program
	verify tx.outputs[targetOutputIndex] == (5, targetAssetID, targetControlProgram);
}
```

Predicates in a consensus program have access to a `block` variable instead.

Predicates can use conditionals and while loops.

```
predicate controlFlowExample(base, power, target) {
	if (power < 0) {
		power = -power;
		(base, target) = (target, base);
	}
	result = 1;
	while (power > 0) {
		power = power - 1;
		result = result * base;
	}
	verify result == target;
}
```


### Contracts

While almost any useful program can theoretically be expressed as a predicate, Ivy provides a more flexible and powerful abstraction for writing programs: a *contract*. Contracts add two useful features: *parameters* and *clauses*.

[sidenote]

Ivy contracts bear some notable resemblances to [Solidity contracts](https://solidity.readthedocs.io/en/develop/structure-of-a-contract.html), but also some significant differences, due to the different transaction models used in Ethereum and Chain. Ivy contracts are just another way of constructing a control, issuance, or consensus program. They have no special status on the blockchain.

[/sidenote]

Contracts take *parameters* and define *clauses*. Once a contract is *instantiated* with particular parameters, its clauses can be called using *arguments*.

**Oleg: i think this whole section could be simplified and made more to the point by using a more realistic signature checking code.**

```
// defining contract
contract IsGreaterThan(a) {
	clause check(b) {
		verify b > a;
	}
}

// instantiating contract
isGreaterThan5 = IsGreaterThan(5);

// satisfying clause
verify IsGreaterThan5.check(6); // completes successfully
```

Note the difference between *parameters* — which are selected when a program is put onto the blockchain — and *arguments* — which are selected later, when someone is attempting to satisfy the contract.

The `IsGreaterThan` contract takes one parameter, `a`. Once instantiated, it can be satisfied by calling its `check` clause with a single argument, `b`.

Contracts can offer a choice among multiple clauses.

```
contract MultipleClausesExample(a) {
	clause checkTwoGreaterNumbers(b, c) {
		verify b > a;
		verify c > a;
	}

	clause checkOneSmallerNumber(d) {
		verify d < a;
	}
}
```

When a contract is evaluated, the caller can choose which clause to satisfy. Satisfying any clause in the contract satisfies the entire contract.

The clause can be selected by name, using dot notation:

```
comparisonToFive = MultipleClausesExample(5);

verify comparisonToFive.checkTwoGreaterNumbers(6, 7); // succeeds
verify comparisonToFive.checkOneSmallerNumber(4); // succeeds
```

Or the contract itself can be called, and the index of the clause can be passed as the first argument:

**Oleg: do you actually use this index syntax? It's quite confusing, i'd rather use contract.clause(i)(args).**

```
verify comparisonToFive(1, 4); // equivalent to: verify comparisonToFive.checkOneSmallerNumber(4); 
```

Clauses can also be assigned to variables and treated as separate predicates.

```
checkTwoGreaterNumbersThanFive = comparisonToFive.checkTwoGreaterNumbers;
verify checkTwoGreaterNumbersThanFive(6, 7);
```

Instantiated contracts can be used as [control programs](#control-programs). For example, the following contract takes a single parameter. When the program is put onto the blockchain as a control program, the value for that parameter is set to the owner's public key. Later, to spend that output, the owner must use her private key to sign the transaction hash, and call the *spend* clause of the control program, passing her signature as an argument. The program checks the signature against the transaction hash and public key to confirm that the transaction is authorized.

```
contract PubKeyControlProgram(publicKey) {
	action spend(signature) {
		verify checksig(publicKey, tx.hash, signature);
	}
}
```

The contract format is a useful tool for describing and developing generic patterns for control programs (and as a result is used throughout the rest of this guide). 

What makes it particularly powerful, however, is that, using some tricks with string manipulation instructions, programs *themselves* can instantiate contracts with parameters to create new programs. In combination with output introspection, this allows construction of complex state machines.

This is examined in more detail in the [contract examples](#contract-examples) below.

## Programs

On the high level, Chain Protocol uses three kinds of programs: control programs, issuance programs, and consensus program.

### Control programs

Control programs define the conditions for spending assets on a blockchain.

Control programs are specified in a transaction output, which also specifies an asset ID and amount. That value is stored on the blockchain in an unspent transaction output (UTXO). To spend that value, someone can create a transaction that uses that UTXO as the source of one of its inputs.

To prove that she is authorized to spend that UTXO, the transaction creator must satisfy the control program. To do so, she may need to pass arguments to the program. These arguments are passed as part of the input *witness*. The witness is not included in the transaction hash, which means it can safely include signatures of that hash.

[sidenote]

Bitcoin uses a sometimes similar system for locking and spending assets. It uses the terms "pkScript" and "sigScript" instead of "control program" and "program arguments."

The design of the input witness is partially inspired by the “segregated witness” proposal, described in [BIP 141](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki) by Pieter Wuille et al., which is expected to be adopted by the Bitcoin network by the end of 2016.

[/sidenote]

We've already seen an example of a simple control program in our discussion of [Ivy contracts](#contracts):

```
contract PubKeyControlProgram(publicKey) {
	clause spend(signature) {
		verify checksig(publicKey, tx.hash, signature);
	}
}
```

This control program requires the spender to pass a valid signature on the current transaction hash that matches the public key.

Control programs can use M-of-N `checkmultisig` instead of a single `checksig`, which can be satisfied by M signatures that each match one of N given public keys. Multisig programs make theft more difficult, and potentially reduce the consequences of losing access to a single key.

```
contract MultisigControlProgram(n, m, ...publickeys[n]) {
	clause spend(...signatures[m]) {
		verify checkmultisig(n, m, publicKeys..., block.hash, signatures...);
	}
}
```

By default, Chain Core uses a different kind of control program in order to support [signature programs](#signature-programs), as described below.

### Issuance programs

Issuance programs define the rules for issuing new units of an asset onto the blockchain.

The issuance program for a given type of asset is fixed when the asset ID is first defined. The issuance program is part of the data structure hashed to create the asset ID, and therefore cannot be changed.

To issue units of an asset, an issuer creates a transaction with one or more issuance inputs specifying some amount of that asset to be issued. Arguments can be passed in the input witness.

A simple issuance program might just check one or more signatures on the transaction doing the issuance. It would therefore look a lot like the control program described above:

```
contract MultisigIssuanceProgram(n, m, ...publickeys[n]) {
	clause issue(...signatures[m]) {
		verify checksig(publicKeys..., tx.hash, signatures...);
	}
}
```

### Consensus programs

Consensus programs define the rules for accepting a new block. 

Each block includes the consensus program that must be satisfied by the *next* block.

Chain's [federated consensus protocol](federated-consensus.md) relies on a quorum of block signers signing the hash of the block. The consensus program can therefore look a lot like the multisignature issuance and control programs described above:

```
contract ConsensusProgram(n, m, ...publickeys[n]) {
	clause checkBlock(...signatures[m]) {
		verify checkmultisig(n, m, publicKeys..., block.hash, signatures...);
	}
}
```

### Signature programs

Chain's programming language also enables a powerful new way to authorize transactions. 

In the above examples of control programs and issuance programs, coinholders and issuers authorize transactions by signing a hash that commits to the entire transaction. This is the typical way that authorization works in UTXO-based cryptocurrencies such as Bitcoin.

[sidenote]

Bitcoin technically allows different "signature hash types" that could provide some of the functionality described below. These signature types are relatively inflexible and complex, and are rarely used in practice.

[/sidenote]

Signing the entire transaction hash is fine if you only want to authorize an input to be spent in a particular transaction. However, what if you only know or care about a particular part of a transaction at the time you sign it? 

For example, suppose Alice wants to sell 5 shares of Acme to Bob, in exchange for 10 USD. Alice wants to authorize the transfer of her Acme shares if and only if she receive payment of 5 USD to her own address. However, Alice does not care what the other input in the transaction will be — i.e., where the other payment will come from. If Alice 

Instead of authorizing a specific transaction, it would be useful if a spender or issuer could authorize any transaction that meets certain criteria.

To enable this, the control program for Alice's Acme shares cannot have the simple form described above, which checks a signature against the transaction hash. Instead, it should look like this:

```
contract P2SPControlProgram(publicKey) {
	clause spend(signature, program, m, ...args[m]) {
		verify checksig(publicKey, program, signature)
		verify program(args...);
	}
}
```

Instead of providing a signature of the transaction hash, the spender provides a signature of a particular *program*, which is then evaluated (with any given arguments). The combined signature and program are referred to as a *signature program*.

The signature program can use transaction introspection to set conditions on particular parts of the transaction.

For example:

```
contract SimpleSignatureProgram(targetHash) {
	clause check() {
		verify tx.hash == targetHash;
	}
}
```

This program turns a signature program into a traditional signature by committing to a specific transaction hash.

But a signature program can do much more than that. For example, this program solves the "exchange" problem described above:

```
contract CheckOutputSignatureProgram(targetOutputIndex, targetAmount, targetAssetID, targetControlProgram, targetReferenceData) {
	clause default() {
		verify tx.outputs[targetOutputIndex] == (targetAmount, targetAssetID, targetControlProgram, targetReferenceData);
	}
}
```

If this contract is initialized with the details of the desired output — say, 5 USD sent to Alice's new address — and signed with the private key corresponding to Alice's , the combined signature program will authorize Alice's input to be spent only in a transaction that includes the desired output. 

[sidenote]

Christopher Allen and Shannon Appelcline explore ideas similar to signature programs in their working paper on “[smart signatures](https://github.com/WebOfTrustInfo/ID2020DesignWorkshop/blob/master/draft-documents/smarter-signatures.md).”

[/sidenote]

## Contract Examples

These examples are provided as illustrations only. They elide over some subtleties, and should not be considered final or secure. If you are interested in using Chain contracts in production, contact us at hello@chain.com.

### Offers and order books

```
contract Offer(askingPrice, currency, sellerAddress) {
	clause lift(paymentIndex) {
		verify tx.outputs[paymentIndex] == (askingPrice, currency, sellerContract);
	}
}
```

That contract will be on the blockchain until someone satisfies it. What if we want to make it cancellable by the seller?

```
contract RevocableOffer(askingPrice, currency, sellerContract) {
	clause lift(paymentIndex) {
		verify tx.outputs[paymentIndex] == (askingPrice, currency, sellerContract);
	}

	clause cancel(m, ...args[m]) {
		verify sellerContract(args...);
	}
}
```

What if we want the offer to be irrevocable for a certain period of time, and then automatically expire after some later point?

```
contract TimeLimitedOffer(askingPrice, currency, sellerContract, revocabilityTime, expirationTime) {
	clause lift(paymentIndex) {
		verify maxtime < expirationTime;
		verify tx.outputs[paymentIndex] == (askingPrice, currency, sellerContract);
	}

	clause cancel(m, ...args[m]) {
		verify mintime > revocabilityTime;
		verify sellerContract(args...);
	}
}
```

What if we want to be able to fill a *partial* order, allowing someone to pay for part of the contract and leaving the rest available for someone else to purchase?

```
contract PartiallyFillableOffer(pricePerUnit, currency, sellerContract, revocabilityTime, expirationTime) {
	clause lift(purchasedAmount, paymentIndex, remainderIndex) {
		verify purchasedAmount > 0;
		verify maxtime < expirationTime;
		verify tx.outputs[paymentIndex] == (purchasedAmount * pricePerUnit, currency, sellerContract);
		verify tx.outputs[remainderIndex] == (tx.currentInput.amount - purchasedAmount, 
											  tx.currentInput.asset,
											  tx.currentInput.program);
	}

	clause cancel(m, ...args[m]) {
		verify mintime > revocabilityTime;
		verify sellerContract(args...);
	}
}
```

Notice that the remainder must be sent to a new contract that is a duplicate of the current one, just controlling fewer assets.

### State Machines

What if you want to get more complex than just replicating the same program, but want to change its state when you do? This is where the contract model really shines. Programs can instantiate contracts with new parameters on the fly.

This contract will prevent its assets from being transferred more than once within a certain time period:

```
contract OncePerPeriod(authorizationPredicate, lastSpend, period) {
	clause spend(m, ...args[m]) {
		// check that the spending is otherwise authorized
		// this could be a signature check
		verify authorizationPredicate(args...);

		// check that at least one day has passed
		verify tx.mintime > lastSpend;

		nextControlProgram = OncePerPeriod(authorizationPredicate,
										   tx.maxtime,
										   period);

		verify tx.outputs[m] == (tx.currentInput.amount,
								 tx.currentInput.asset,
								 nextControlProgram);
	}
}
```

### Singletons

While most state should be tracked locally in the contract parameters for a specific UTXO, some on-chain use cases may require keeping track of "global" state. For example, one may want to limit issuance of an asset, so only 100 units can be issued per day. This can be done using the *singleton* design pattern.

First, one needs to create an asset for which only one unit can ever be issued. This requires some understanding of how the Chain Protocol handles issuances. Unique issuance — ensuring that issuances cannot be replayed — is a challenging problem that is outside the scope of this paper. The Chain Protocol's solution is that each issuance input has a nonce, which, when combined with the transaction's mintime and maxtime and the asset ID, must be unique throughout the blockchain's history. As a result, an issuance program can ensure that it is only used once by committing to a specific nonce, transaction mintime, and transaction maxtime:

```
contract SinglyIssuableAssetSingletonToken(nonce, mintime, maxtime, amount, lockProgram) {
	clause issue(outputIndex) {
		// ensure that asset can only be issued once
		verify nonce == tx.currentInput.nonce;
		verify mintime == tx.mintime;
		verify maxtime == tx.maxtime;

		// ensure that only one unit is issued
		verify tx.currentInput.amount == 1;

		// ensure that the issued unit is locked with the target lockProgram
		verify tx.outputs[outputIndex] == (tx.currentInput.amount,
										   tx.currentInput.asset,
										   lockProgram)
	}
}
```

This means there will only be one UTXO on the blockchain with this asset ID at a given time. As a result, it can be used as a *singleton* — a token to keep track of some piece of global state for other asset IDs.

The `lockProgram` parameter of this contract determines the rules that will govern the token.

For example, we've already seen the `OncePerPeriod` contract. If that contract is used as the “lock program”, the singleton token can be prevented from being spent more than once in a particular amount of time.

How does that help us with metered issuance? We can create a separate asset with an issuance program that checks that the singleton is also spent in the same transaction, and that no more than a given amount is issued.

```
contract MeteredAssetIssuanceProgram(authorizationPredicate, singletonAssetID, maxAmount) {
	clause issue(singletonControlProgram,
			     singletonIndex, m, ...args[m]) {
		// check that the issuance is otherwise authorized
		verify authorizationPredicate(args...);

		// check that no more than the max amount is being issued
		verify tx.currentInput.amount < maxAmount;

		// check that the singleton token is being spent
		// its index and control program don't need to be checked
		// which is why they are passed as arguments
		verify tx.outputs[outputIndex] == (1,
										   singletonAssetID,
										   singletonControlProgram);
	}
}
```

### Private Contracts

Normally, when a control program is added to the blockchain, the logic is available immediately. What if we don't want to reveal our public keys or logic when the control program is first put on the blockchain, but only when it is spent? The control program could commit to a *hash* of the relevant contract. (Bitcoin supports a similar pattern, known as "Pay to Script Hash"; see [BIP 13](https://github.com/bitcoin/bips/blob/master/bip-0013.mediawiki)).

```
contract P2SHControlProgram(contractHash) {
	clause spend(contract, m, ...args[m]) {
		verify sha3(contract) == contractHash;
		verify contract(args...);
	}
}
```

But what if parties want to avoid *ever* revealing the logic to the blockchain? They can avoid doing so — in the normal case — by adding an additional clause that lets all interested parties spend the output without revealing the contract:

```
contract PrivateContractControlProgram(contractHash, n, ...publicKeys[n]) {
	clause settle(...sigs[n]) {
		// all interested parties can agree to the final result of the contract
		verify checkmultisig(n, n, publicKeys..., tx.hash, sigs...);
	}

	clause enforce(contract, m, ...args[m]) {
		// any party can reveal the contract and enforce it
		verify sha3(contract) == contractHash;
		verify contract(args...);
	}
}
```

Parties can evaluate the contract offline, determine the result, mutually agree to how it should resolve, and provide their signatures on the resulting transaction. If any party refuses to agree to the result, another party can enforce the contract by making its code public. This is more similar to how contract enforcement works in the real world.

[sidenote]

This idea can be extended to implement full [Merklized Abstract Syntax Trees](http://www.mit.edu/~jlrubin/public/pdfs/858report.pdf) — programs for which unexecuted branches do not need to be revealed. Similar ideas have also been explored by so-called "payment channels" in Bitcoin, most famously in the [Lightning Network](https://lightning.network/) project, as well as "[state channels](http://www.jeffcoleman.ca/state-channels/)" in Ethereum.

[/sidenote]


