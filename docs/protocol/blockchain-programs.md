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

Run cost also takes into account current memory usage. Adding an item to the stack has a cost based on the size of the item; removing an item from the stack refunds that cost.

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

CVM bytecode is a low-level language, making it difficult to write complex programs and smart contracts. Chain is developing a high-level language, *Ivy*, that compiles to CVM bytecode. Ivy is still in active development and evolution, and this explanation is provided only for illustration.

[sidenote]

Similarly, most development for the EVM is done using [Solidity](https://solidity.readthedocs.io/en/develop/), a high-level language that has been compared to JavaScript. While Ivy and Solidity have some similarities, Solidity can be roughly classified as an object-oriented procedural language, while Ivy fits better into the paradigm of a *declarative language*, reflecting the design differences between Ethereum's and Chain's transaction models.

[/sidenote]

Ivy supports the same arithmetic, logical, cryptographic, and string operations as the CVM, but uses more recognizable infix and function-call syntax, such as `2 + 2`, `4 > 5`, or `sha3("foobar")`. *Statements* in Ivy begin with the `verify` keyword and end with a semi-colon; they halt execution and fail if the .

For example, `verify 4 + 5 > 2 * 3;` is a statement that compiles to `OP_4 OP_5 ADD OP_2 OP_3 MUL VERIFY`.

*Predicates* in Ivy are typically sequences of one or more `verify` statements, possibly combined with some control flow operations. If , the predicate returns true.

```
predicate basicExample() { 
	verify 6 > 5; 
}
```

Predicates may take *arguments*, meaning they expect data to already be on the stack.

```
predicate argumentExample() { 
	verify a > 5; 
	verify a < 10;
}
```

I

```
```

Predicates can take other predicates as arguments

`predicate applyPredicate(a) {
		
}`

## Programs

Programs are currently used in three places in the protocol.

All programs are really predicates — they return `true` or `false`.

Whether a program is satisfied content of block headers (for consensus programs) or transactions (). and blocks contain a *witness* that includes *arguments* to be passed to the program.

When validating a program, the CVM initializes the data stack with program arguments passed from the witness. The program is then executed. Validation is successful if the program finishes execution and leaves a “true” value on top of the stack.

### Control programs

### Issuance programs

### Consensus programs

### Signature programs

Chain's scripting language also enables a powerful new way for coinholders to authorize transactions.

In typical UTXO-based cryptocurrencies such as Bitcoin, coinholders authorize transactions by signing a hash that commits to the entire transaction.

[sidenote]

Bitcoin technically allows different "signature hash types" that could provide some of the functionality described below. These signature types are relatively inflexible and complex, and are rarely used in practice.

[/sidenote]

However, what if you don't yet know the entire transaction hash at the time you sign the transaction? For example, suppose you want to sell shares of Acme for USD. You want to unlock your UTXO that contains Acme shares if and only if you receive payment in USD to your own address. However, you don't yet know or care where the USD comes from.

This is made possible by the `CHECKPREDICATE` opcode, combined with the introspection opcodes.

[sidenote]

Christopher Allen and others have explored similar ideas in their [working paper](https://github.com/WebOfTrustInfo/ID2020DesignWorkshop/blob/master/draft-documents/smarter-signatures.md) on "smart signatures."

[/sidenote]

#### Smart Contracts

Typical UTXOs — including signed-predicate-enabled UTXOs — are controlled by some combination of private keys.

Smart contracts — in the Chain context — are control programs that use the introspection opcodes to .

 Chain Virtual Machine — particularly the introspection opcodes.

* On-chain and off-chain contracts

