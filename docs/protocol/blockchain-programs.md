## Blockchain Programs

### Chain Virtual Machine

The Chain Protocol specifies the operation of the Chain Virtual Machine (CVM). The CVM is a stack machine; each instruction deterministically performs operations on a data stack. [Footnote: Ethereum uses a stack-based virtual machine, the Ethereum Virtual Machine (EVM). Bitcoin's scripting language, Bitcoin Script, also uses a stack-based virtual machine.]

The CVM's instruction set is Turing-complete. To prevent programs from using too many computational resources, the protocol allows networks to set a "run limit" that scripts are not allowed to exceed. [Footnote: This is similar to Ethereum's "gas", except that there is no on-chain accounting for the execution cost of a transaction.]

The CVM provides 

* Transaction introspection opcodes
	* The CVM provides opcodes that, when used in an output's control program, introspect elements of any transaction attempting to spend that output. [Footnote: The EVM includes many opcodes that provide introspection into the execution environment, although its radically different transaction model means those opcodes are not different. Bitcoin has recently taken steps toward fuller transaction introspection from the VM, with "CheckLockTimeVerify".]
	* `CHECKOUTPUT` allows an input to introspect the outputs of the transaction. This allows it to place restrictions on how its value — or other value included in the same transaction — is subsequently used. [Footnote: A similar opcode was been proposed by Möser et al in their [Bitcoin Covenants](http://fc16.ifca.ai/bitcoin/papers/MES16.pdf) paper, which also proposes some applications.].
	* `MINTIME` and `MAXTIME` allow limitations on when a UTXO can be spent. [Footnote: the 
	* `AMOUNT`, `ASSET`, `PROGRAM`, `REFDATAHASH`, and `INDEX` allow a control program to introspect the input itself.
* Predicate evaluation opcodes
	* `CHECKPREDICATE` evaluates a script (written in CVM bytecode). The script is evaluated in a sandboxed VM, and can introspect the transaction.
* Control flow opcodes
	* `JUMPIF` conditionally jumps to another part of the code, based on the current value on top of the stack. This can be used to implement conditionals and loops.

Chain is developing a higher-level language, *Ivy* for writing scripts that compile to CVM. Examples can be seen in the protocol documentation.

### Programs

The CVM is used .

#### Control programs

To spend an output, 

#### Issuance programs

#### Consensus programs

#### Signed predicates

Our scripting language also enables a powerful new way for coinholders to authorize transactions.

In typical UTXO-based cryptocurrencies such as Bitcoin, coinholders authorize transactions by signing the entire transaction. [Footnote: The "signature hash" used in Bitcoin is more complex.]

However, what if you don't yet know the entire transaction hash? For example, what if you want to purchase ? [Footnote: Bitcoin supports "hash types" that allow signing only particular parts of a transaction, although they are rarely used.]

This is made possible by the `CHECKPREDICATE` opcode, combined with the introspection opcodes.

[Footnote: This is related to Christopher Allen's working paper on smart signatures.]

#### Smart Contracts

Typical UTXOs — including signed-predicate-enabled UTXOs — are controlled by some combination of private keys.

Smart contracts — in the Chain context — are control programs that use the introspection opcodes to .

 Chain Virtual Machine — particularly the introspection opcodes.

* On-chain and off-chain contracts

