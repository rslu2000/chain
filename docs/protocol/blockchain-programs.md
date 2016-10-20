# Blockchain Programs

Chain Protocol blockchains are designed to be flexible and programmable, supporting custom logic at every level.

* Issuance programs specify the rules for issuing new units of an asset.
* Control programs specify the rules for spending existing units of an asset.
* Consensus programs specify the rules for accepting new blocks.

Programs authenticate the data structure in which they are used. They run deterministically, use capped memory and time requirements, and can be evaluated in parallel.

Programs are flexible enough to allow implementing a wide range of financial instruments (such as options, bonds, and swaps), security schemes (for storing assets), and “smart contract” applications such as offers, order books, and auctions.

## Chain Virtual Machine

A program is written in bytecode — instructions for the Chain Virtual Machine (CVM). The CVM is a stack machine: each instruction performs operations on a *data stack*, usually working on the items on top of the stack. All items on the data stack are strings of bytes (although some instructions convert them to and from numbers or booleans in order to perform operations on them). The CVM also has an *alt stack* to simplify stack manipulation.

[sidenote]
Bitcoin, similarly, uses scripts as predicates in order to determine whether a given state transition — encoded in a transaction — is authorized. This is different from Ethereum’s approach, in which programs directly compute the resulting state.
[/sidenote]

### Run limit

The CVM’s instruction set is Turing-complete. To prevent unbounded use of computational resources, the protocol allows networks to set a *run limit* that a program is not allowed to exceed. Each instruction consumes some of the limit as it runs, according to its *run cost*.

Processing-intensive instructions, such as signature checks, are more expensive.

The run cost also takes into account the stack's current memory usage. Adding an item to the stack has a cost based on the size of the item; removing an item from the stack refunds that cost.

[sidenote]
Both Bitcoin and Ethereum have restrictions that prevent script execution from using excessive time or memory. Chain’s runlimit mechanism is similar to Ethereum’s “gas,” except that there is no on-chain accounting for the execution cost of a transaction.
[/sidenote]

### Instruction Set

The CVM has some overlaps and similarities with Bitcoin Script, but adds opcodes to support additional functionality, including loops, state transitions (through transaction introspection), and script evaluation.

This is an informal summary of the functionality provided by CVM instructions. For a complete list and more precise definitions, see the VM specification.

#### Stack manipulation instructions

`PUSHDATA` instructions push a specified bytestring to the data stack.

`DROP`, `DUP`, `SWAP`, `PICK`, and other move stack items around.

`TOALTSTACK` and `FROMALTSTACK` move items between the data and alt stacks, which can make some stack manipulations easier.

#### String manipulation instructions

`EQUAL` checks for the equality of two strings. `CAT`, `SUBSTR`, `LEFT`, and `RIGHT` perform operations on strings from the top of the stack. `AND`, `OR`, `XOR` perform bitwise operations.

#### Arithmetic instructions

While all items on the stack are strings, some instructions interpret items as numbers, using 64-bit two's complement representation.

#### Logical and boolean instructions

Items on the stack can also be interpreted as booleans, based on whether all .

#### Cryptographic instructions

The `SHA1`, `SHA256`, `SHA3`, and `RIPEMD` instructions execute those standard hash functions.

The `CHECKSIG` instruction checks the validity of an Ed25519 signature against a given public key and message. [sidenote]

`CHECKMULTISIG` checks an `m-of-n` signature.

#### Control flow instructions

`VERIFY` pops the top value from the data stack and checks if it is `true`. If it is not, or if there is no top value, the entire program fails.

`JUMPIF` conditionally jumps to another part of the code, based on the current value on top of the stack. This can be used to implement conditionals and loops.

`CHECKPREDICATE` evaluates a script (written in CVM bytecode). The script is evaluated in a sandboxed VM, and can introspect the transaction.

#### Introspection instructions

The CVM provides opcodes that, when used in an output's control program, introspect elements of any transaction attempting to spend that output. 

[sidenote]

The EVM includes many opcodes that provide introspection into the execution environment, although its radically different transaction model means those opcodes are not different. Bitcoin has recently taken steps toward fuller transaction introspection from the VM, with `CheckLockTimeVerify`.

[/sidenote]

`CHECKOUTPUT` allows an input to introspect the outputs of the transaction. This allows it to place restrictions on how its value — or other value included in the same transaction — is subsequently used. This instruction provides functionality similar to the CHECKOUTPUTVERIFY opcode proposed by Malte Möser, Ittay Eyal, and Emin Gün Sirer in their Bitcoin Covenants paper.

`MINTIME` and `MAXTIME` allow limitations on when a UTXO can be spent. 

`AMOUNT`, `ASSET`, `PROGRAM`, `REFDATAHASH`, and `INDEX` allow a control program to introspect the input itself.

## Ivy

Chain is developing a high-level language, *Ivy*, that compiles to CVM bytecode, to make it easier to write programs. Ivy is still evolving, and this explanation and tutorial is provided only to help ground the examples used below.

[sidenote]

Similarly, most development for the EVM is done using [Solidity](https://solidity.readthedocs.io/en/develop/), a high-level language that has been compared to JavaScript. While Ivy and Solidity have some similarities in syntax, they have very different semantics. Solidity can be roughly classified as an object-oriented imperative language, while Ivy fits better into the paradigm of a *declarative language*, though it has some imperative elements. This reflects the design differences between Ethereum's and Chain's transaction models. 

[/sidenote]

## Predicates

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
	verify tx.outputs[targetOutputIndex] == (5, targetAssetID, targetControlProgram)
}
```

(Predicates in a consensus program have access to a `block` variable instead).

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

While almost any useful program can theoretically be expressed as a predicate, Ivy provides a more flexible and powerful abstraction for writing programs: a *contract*. Contracts add two useful features: *clauses* and *parameters*.

[sidenote]

Ivy contracts bear some notable resemblances to Solidity [contracts](https://solidity.readthedocs.io/en/develop/structure-of-a-contract.html), but also some significant differences, due to the different transaction models used in Ethereum and Chain. Ivy contracts are just another way of constructing a control, issuance, or consensus program. They have no special status on the blockchain.

[/sidenote]

Contracts have one or more named *clauses*, each of which is its own predicate. To satisfy a contract, one can choose which clause to satisfy. For example, this contract can be satisfied at any time by choosing the appropriate clause for the current time.

```
contract TimeControlledContract() {
	clause before() {
		verify tx.maxtime < 1477267200;
	}
	clause after() {
		verify tx.mintime >= 1477267200;
	}
}
```

Contracts also take *parameters*. This allows developers to define *generic* programs.

For example, the following contract (which can be used as a simple [control program](#control-programs)) takes a single parameter. When the program is put onto the blockchain as a control program, the value for that parameter is set to the owner's public key. Later, to spend that output, the owner must use her private key to sign the transaction hash, and pass the signature as an argument. The program checks the signature against the transaction hash and public key to confirm that the transaction is authorized.

```
contract PubKeyControlProgram(publicKey) {
	clause spend(signature) {
		verify checksig(publicKey, tx.hash, signature);
	}
}
```

Note the difference between *parameters* — which are selected when a program is put onto the blockchain — and *arguments* — which are selected later, when someone is attempting to satisfy that program.

The contract format is a useful tool for describing and developing generic patterns for control programs, and as a result is used throughout the rest of this guide. What makes it particularly powerful, however, is that, using some tricks with string manipulation instructions, programs *themselves* can instantiate contracts with parameters to create new programs. In combination with output introspection, this allows construction of complex state machines.

For example, this contract allows its assets to be transferred from public key to public key, but doesn't allow them to be split up.

```
contract BundledAsset(publicKey) {
	clause transfer(signature, newPublicKey, outputIndex) {
		verify checksig(publicKey, tx.hash, signature);
		verify tx.outputs[outputIndex] == (tx.currentInput.amount, tx.currentInput.asset, BundledAsset(newPublicKey));
	}
}
```

This contract does the same thing, but also counts the number of times it has been transferred, and allows the assets to be freed after 50 transfers:

```
contract BundledAssetWithCounter(publicKey, counter) {
	clause transfer(signature, newPublicKey, outputIndex) {
		verify checksig(publicKey, tx.hash, signature);
		verify tx.outputs[outputIndex] == (tx.currentInput.amount, tx.currentInput.asset, BundledAssetWithCounter(newPublicKey, counter + 1));
	}

	clause free(signature) {
		verify checksig(publicKey, tx.hash, signature);
		verify counter >= 50;
	}
}
```

These techniques are the basis of [smart contracts](#smart-contracts), which are examined more closely below.

## Programs

The Chain Protocol uses three kinds of programs: control programs, issuance programs, and consensus program.

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

Control programs can use M-of-N `checkmultisig` instead of a single `checksig`, which can be satisfied by M signatures that each match one of N given public keys. Multisig programs make theft more difficult, and potentially reduce the consequences of losing access to a single key.

```
contract MultisigControlProgram(n, m, ...publickeys[n]) {
	clause spend(...signatures[m]) {
		verify checksig(publicKeys..., block.hash, signatures...);
	}
}
```

This control program requires the spender to pass a valid signature on the current transaction hash that matches the public key.

### Issuance programs

Issuance programs define the rules for issuing new units of an asset onto the blockchain.

The issuance program for a given type of asset is fixed when the asset ID is first defined. The issuance program is part of the data structure hashed to create the asset ID, and therefore cannot be changed.

To issue units of an asset, an issuer creates a transaction with one or more issuance inputs specifying some amount of that asset to be issued. Arguments can be passed in the input witness.

A simple issuance program might just check one or more signatures on the transaction doing the issuance. It would therefore look a lot like the control program described above:

```
contract MultisigIssuanceProgram(n, m, ...publickeys[n]) {
	clause spend(...signatures[m]) {
		verify checksig(publicKeys..., tx.hash, signatures...);
	}
}
```

### Consensus programs

Consensus programs define the rules for accepting a new block. 

Each block includes the consensus program that must be satisfied by the *next* block.

Chain's [federated consensus protocol]() relies on a quorum of block signers signing the hash of the block. The consensus program can therefore look a lot like the multisignature issuance and control programs described above:

```
contract ConsensusProgram(n, m, ...publickeys[n]) {
	clause spend(...signatures[m]) {
		verify checksig(publicKeys..., block.hash, signatures...);
	}
}
```

### Signature programs

Chain's scripting language also enables a powerful new way to authorize transactions. 

In the above examples of control programs and issuance programs, coinholders and issuers authorize transactions by signing a hash that commits to the entire transaction. This is the typical way that authorization works in UTXO-based cryptocurrencies such as Bitcoin.

[sidenote]

Bitcoin technically allows different "signature hash types" that could provide some of the functionality described below. These signature types are relatively inflexible and complex, and are rarely used in practice.

[/sidenote]

Signing the entire transaction hash is fine if you only want to authorize an input to be spent in a particular transaction. However, what if you only know or care about a particular part of a transaction at the time you sign it? 

For example, suppose Alice wants to sell 5 shares of Acme to Bob, in exchange for 10 USD. Alice wants to authorize the transfer of her Acme shares if and only if she receive payment of 5 USD to her own address. However, Alice does not care what the other input in the transaction will be — i.e., where the other payment will come from. If Alice 

Instead of authorizing a specific transaction, it would be useful if a spender or issuer could authorize any transaction that meets certain criteria.

To enable this, the control program for Alice's Acme shares cannot have the simple form described above, which checks a signature against the transaction hash. Instead, it should look like this:

```
contract FlexibleControlProgram(publicKey) {
	spend(signature, program) {
		verify checksig(publicKey, program, signature)
		verify program();
	}
}
```

Instead of providing a signature of the transaction hash, the spender provides a signature of a particular *program*, which is then evaluated. The combined signature and program are referred to as a *signature program*.

The signature program can use transaction introspection to set conditions on particular parts of the transaction.

For example:

```
contract SimpleSignatureProgram(targetHash) {
	clause spend() {
		verify tx.hash = targetHash;
	}
}
```

This program turns a signature program into a traditional signature by committing to a specific transaction hash.

But a signature program can do much more than that. For example, this program solves the "exchange" problem described above:

```
contract CheckOutputSignatureProgram(targetOutputIndex, targetAmount, targetAssetID, targetControlProgram, targetReferenceData) {
	clause spend() {
		verify tx.outputs[targetOutputIndex] == (targetAmount, targetAssetID, targetControlProgram, targetReferenceData);
	}
}
```

If this contract is initialized with the details of the desired output — say, 5 USD sent to Alice's new address — and signed with the private key corresponding to Alice's , the combined signature program will authorize Alice's input to be spent only in a transaction that includes the desired output. 

[sidenote]

Christopher Allen and others explored ideas similar to signature programs in their [working paper](https://github.com/WebOfTrustInfo/ID2020DesignWorkshop/blob/master/draft-documents/smarter-signatures.md) on "smart signatures."

[/sidenote]

## Smart Contracts

TBD!
