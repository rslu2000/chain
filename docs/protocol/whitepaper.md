# Chain Protocol Whitepaper

## 1. Introduction

[In the modern financial system](blockchain-extensibility.md), assets (such as currencies, securities, and derivatives) are typically held and traded electronically. This miraculous abstraction hides the true complexity of the system: a messy decentralized web of mutual obligations, indirect ownership, and periodic settlement. Transferring assets often requires point-to-point interaction between multiple intermediaries, and reconciliation of duplicated ledgers.

This system has many downsides:

* Time: settlement of asset transfers or payments often takes days.

* Cost: transfers involve fee payments to multiple intermediaries and cover expensive reconciliation processes.

* Transparency: it may be difficult to find out the status of a pending transfer, or the current owner of an asset.

* Atomicity: transfers may not complete, and it is difficult to make one transfer conditional on another.

* Security: the complexity of the existing system makes it difficult to prevent fraud or theft.

* Finality: whether transactions are reversible depends on the transfer mechanism, rather than the business requirements of the transacting party

Many of these problems could be addressed if asset ownership were recorded on a *single shared ledger*. But a combination of practical and technological constraints have made such ledgers difficult to adopt. Such a shared ledger would seem to require trust in a single party. That party would also need to have the technical capacity to process every transaction in real time. Additionally, to support reversible, atomic, or complex transactions, the ledger would need to support more sophisticated logic than simple ownership changes.

In 2009, Satoshi Nakamoto introduced [Bitcoin](https://bitcoin.org/bitcoin.pdf), the first implementation of a protocol that enables issuance of a digital bearer instrument without a trusted third party, using a ledger replication system that has come to be known as a "blockchain." Bitcoin solves the difficult problem of implementing decentralized digital cash, but its security model limits its efficiency and throughput, its design only supports a single native asset, and it has only limited support for “smart contracts”—custom programs that determine asset movement. 

The Ethereum blockchain, which launched in 2015, is designed as a platform for decentralized computation. While it includes a much more powerful programming language for smart contracts, it presents additional challenges for scalability and efficiency. Additionally, its general-purpose computation model makes it difficult for application designers to reason about security. It is also not tailored for financial applications. For example, the network supports only one native currency, although smart contracts can be used to simulate other types of "tokens."

In contrast to Bitcoin and Ethereum, which are designed to operate on the public Internet (a highly hostile environment), most financial activity already occurs within a restricted network of financial institutions. A shared ledger operated within this network can exhibit the advantages of blockchain technology without sacrificing the efficiency, security, privacy, and flexibility needed by financial institutions.

In this paper, we present the Chain Protocol: a blueprint for a multi-asset shared ledger that can be operated by a federation of financial institutions. It supports the coexistence and interoperability of multiple independent networks with different operators sharing a common format and capabilities. Using the principle of least authority, control over assets is separated from control over ledger synchronization.

The Chain Protocol allows anyone to define and issue assets by using custom "issuance programs." Once issued, units of an asset are controlled by "control programs." These programs are expressed in a flexible and Turing-complete programming language that can be used to build sophisticated smart contracts.

Each network is secured by a federation of "block signers." The system is secure against forks as long as a quorum of block signers follows the protocol. For efficiency, block creation is delegated to a single "block generator." Any nodes on the network can validate blocks and can submit transactions to the network.

Chain Core is an enterprise software product that implements the Chain Protocol. An open-source [developer edition](https://github.com/chain/chain) is freely available, and (as of October 2016) Chain operates a Chain Protocol blockchain network as a freely accessible testnet.

Sections 2, 3, and 4 describe key concepts (assets, transactions, programs, blockchain and consensus protocol) and discuss how programmed rules are enforced and double-spending is prevented.

Subsequent sections 5, 6, 7 and 8 discuss various aspects of the blockchain network: scalability, privacy, extensibility and interoperability with other networks.

## 2. Data Model

The purpose of a Chain blockchain network is to manage ownership and control of digital *assets*. Assets are issued, transferred, and exchanged by posting *transactions* to the network. These transactions are ordered and batched into *blocks*, which together form an immutable *blockchain*.

#### Assets

A single Chain blockchain can support multiple asset types.

Each asset type is identified by an asset identifier, or *asset ID*. An asset ID is a 256-bit string designed to be globally unique not only within one blockchain, but across all blockchains.

Asset IDs correspond to an *issuance program*, which defines the rules for issuing units of that asset. Once units have been issued, the rules for spending them are determined by *control programs*. 

#### Transactions

Transactions move value from *inputs* to *outputs*. Each input specifies a source of value — either an issuance of new units, or an output from a previous transaction. Each output specifies a destination — namely, a control program defining the rules for spending that output in the future.

Each input and output specifies a quantity of a single asset type. A transaction can mix inputs and outputs of different asset types, or merge or split inputs into outputs with different amounts, as long as the total values of the inputs and the total values of the outputs balance.

**[Diagram of balanced multi-asset transaction]**

Each input must satisfy an issuance program (if the source of value is a new issuance of units) or a control program (if the source of value is a previous unspent transaction output). The spender may pass *arguments* to the program via the *witness* field. For example, an issuance or control program can implement an authorization check by including a public key that verifies that a cryptographic signature of the new transaction is created using the corresponding private key.

Each transaction, and each individual input and output, includes a *reference data* field for arbitrary application-level uses. The Chain Protocol specifies how reference data is committed to the blockchain, but does not mandate any structure or semantics for its contents.

#### Blocks

Once a transaction has spent a particular output, no other transaction is allowed to spend that same output. To prevent such "double-spending", the network maintains a unique and immutable ordering of all transactions together with a *blockchain state* consisting of *unspent transaction outputs* (UTXOs). Transaction inputs are allowed to reference only unspent outputs from the UTXO set. Once a transaction is applied, the spent outputs are removed from the set and the new outputs are added to it.

A *block* is a data structure that batches multiple transactions to be executed. Each *block header* contains the hash of the previous block header, turning the series of blocks into an immutable *blockchain*. 

[sidenote]

A *hash* is the result of running a deterministic one-way hash function on a given string of input data. It is generally infeasible to reverse the hash function to determine an input from an output, or to find two inputs that hash to the same output. This latter property is what makes blockchains immutable, since it makes it impossible to change a block without changing its hash, and thus changing the hashes in the headers of all subsequent blocks.

[/sidenote]

In addition to containing a hash committing to the transactions included in the block, the block contains a hash committing to the current blockchain state — i.e., the set of remaining unspent outputs. This "snapshot" of the block state makes it easy for a network participant to join an ongoing network.

[sidenote]

Each of these hashes is actually the root of a *Merkle tree*, which enables compact proofs of existence of any given transaction or unspent output, and allows downloading and verifying the elements of the tree concurrently.

[/sidenote]

To prevent unauthorized participants from creating new blocks, each new block must satisfy a *consensus program*, which is specified in the header of the previous block. The consensus program — much like an issuance or control program — receives  arguments from the new block's *witness* field.

For example, a consensus program could specify a public key, and require that the next block's witness contain a signature by the corresponding private key, using the block hash as a message. This is the basis of the consensus programs used in Chain's [federated consensus protocol](#5-consensus). The flexibility and power of the [programming language](#3-programs), however, means that the protocol could theoretically support arbitrary consensus algorithms — even complex ones based on "proof-of-work" or "proof-of-stake".

## 3. Programs

Chain Protocol blockchains are designed to be flexible and programmable, supporting custom logic at every level.

* *Issuance programs* specify the rules for issuing new units of an asset.

* *Control programs* specify the rules for spending existing units of an asset.

* *Consensus programs* specify the rules for accepting new blocks.

Programs authenticate the data structure in which they are used. They run deterministically, use capped memory and time requirements, and can be evaluated in parallel.

Programs are flexible enough to allow implementing a wide range of financial instruments (such as options, bonds, and swaps), security schemes (for storing assets), and "smart contract" applications such as offers, order books, and auctions.

#### Virtual machine

A *program* is written in *bytecode* — instructions for the Chain Virtual Machine (CVM). The CVM is a stack machine: each instruction performs operations on a data stack. 

When validating a program, the CVM initializes the data stack with *program arguments* passed from the witness. The program is then executed. Validation is successful if the program finishes execution and leaves a "true" value on top of the stack.

The CVM's instruction set is Turing-complete. To prevent unbounded use of computational resources, the protocol allows networks to set a *run limit* that a program is not allowed to exceed. Each instruction consumes some of the limit as it runs, according to its *run cost*.

[sidenote]

Bitcoin, similarly, uses scripts as predicates in order to determine whether a given state transition — encoded in a transaction — is authorized. This is different from Ethereum’s approach, in which programs directly compute the resulting state.

Both Bitcoin and Ethereum have restrictions that prevent script execution from using excessive time or memory. Chain’s runlimit mechanism is similar to Ethereum’s “gas,” except that there is no on-chain accounting for the execution cost of a transaction.

[/sidenote]

The CVM provides a range of data processing instructions from arithmetic operations to higher-level cryptographic functions such as SHA3, CHECKSIG, and CHECKMULTISIG. It also supports transaction introspection instructions and  flexible control-flow operations.

#### Introspection

*Transaction introspection* instructions allow an issuance program or control program to define not only *who* can spend it, but *when* it can be spent and *how* it can be used. They do this by allowing the program to access and test fields of the transaction.

The TXSIGHASH instruction gets the hash of the current transaction, allowing the program to check that a spender has provided a valid signature on it.

The MINTIME and MAXTIME instructions push the respective "mintime" and “maxtime” fields of the transaction, allowing the program to prevent spending or issuance after a given deadline, or before a given release time.

The CHECKOUTPUT instruction allows a program to verify that specific amounts of assets are sent to outputs with specific control programs.This, along with introspection instructions that allow access to information about the input being spent (AMOUNT, ASSET, PROGRAM, and INDEX), allows developers to implement arbitrary state machines to govern assets.

[sidenote]

The MINTIME and MAXTIME instructions and their associated transaction fields provide functionality similar to Bitcoin’s CHECKLOCKTIMEVERIFY.

The CHECKOUTPUT instruction provides functionality similar to CHECKOUTPUTVERIFY as proposed by Malte Möser, Ittay Eyal, and Emin Gün Sirer in their [Bitcoin Covenants](http://fc16.ifca.ai/bitcoin/papers/MES16.pdf) paper.

[/sidenote]

The protocol also specifies several *block introspection* instructions (BLOCKSIGHASH, BLOCKSIGHASH). These instructions can only be used in consensus programs (since transactions must be capable of being validated independently of the block header).

#### Control flow

Programs can implement conditional branches and loops using the JUMP and JUMPIF instructions, which allow branching to a statically defined address in the program. The run limit ensures that infinite loops are not possible.

Programs can verify other programs using the CHECKPREDICATE instruction, which evaluates an arbitrary byte string as a program with given arguments. 

This permits a generalization of signatures where, instead of signing a specific message (such as a transaction hash), the signer signs a predicate in its byte-string form. The combined signature and predicate is a "signature program" that is considered a valid signature on any message for which the predicate evaluates to true. When combined with the introspection instructions, signature programs allow much greater flexibility in spending a transaction: instead of authorizing a specific transaction by signing its hash, a spender can sign a set of conditions that the transaction must fulfill (which may include having a specific hash). 

CHECKPREDICATE enables many other powerful features, including "Merkleized programs" (see [BIP 114](https://github.com/bitcoin/bips/blob/master/bip-0114.mediawiki)) that commit to hashes of each branch, and whose unexecuted branches never need to be revealed.

## 4. Consensus

As described above, the consensus program allows the blockchain to implement arbitrary consensus protocols. The first version of the Chain Protocol specifies a default consensus algorithm based on approval from a federation of block signers.

The consensus program specifies a set of N public keys, and uses the CHECKMULTISIG and BLOCKSIGHASH instructions to confirm that the block witness includes M valid signatures on the block hash, where M and N are parameters of the algorithm.

Each public key corresponds to a block signer. Block signers never sign two different blocks with the same height. As long as no more than 2M - N - 1 block signers violate this rule, the blockchain cannot be forked.

Because of this rule, blocks must coordinate to make sure they sign the same block. To ensure this, the block signers rely on a single *block generator*. The block generator collects transactions, periodically batching valid ones  together into blocks.

The generator sends the proposed new block to the block signers. Block signers only sign blocks that have already been signed by the generator.

While the block generator is not capable of forking the blockchain, it does have a privileged role. The block generator has control over network liveness: if the block generator crashes or otherwise stops producing new blocks, the blockchain halts. The block generator can also deadlock the network by sending inconsistent blocks to different block signers. Additionally, the block generator has control over the block timestamp, and can produce blocks with artificially "slow" timestamps. 

These sacrifices are considered acceptable based on the current anticipated business use cases for the protocol. For most permissioned networks, it makes sense to have a single company or market utilityother entity responsible for continued operation of the network. High-availability of the block generator is an engineering problem that can be solved through non-Byzantine-fault-tolerant replication within that entity. If the block generator behaves maliciously, or is intentionally shut down, it is probably better for the network to stop. Such misbehavior can be detected and dealt with out-of-band.

This consensus protocol therefore does not attempt to solve the general problem of Byzantine agreement. It requires trust assumptions that are unusually strong relative to Byzantine-fault-tolerant algorithms, but usefully weak relative to centralized databases. In practice, they are reasonable for some real-world deployments. Future versions of the Chain Protocol may specify consensus protocols with weaker assumptions for a broader range of applicability.

## 5. Security

The Chain Protocol is intended to be secure under realistic threat models for specific use cases.

#### Direct asset ownership

Assets are typically controlled by one or more cryptographic keys. Chain supports M-of-N *multisignature* control programs and issuance programs, reducing the damage that can be done by an attacker that compromises a single key. The Chain Protocol uses highly secure Ed25519 keys, which are increasingly being adopted as an industry standard. Private keys can be stored in hardware security modules (HSMs), making key compromise much more difficult.

#### Privacy

Traditional ledgers achieve a level of privacy by limiting information access to the parties involved and the trusted third party. By contrast, the need of a blockchain system to announce all transactions to all network participants precludes this method. Privacy can still be maintained, however, by breaking the flow of information in another place: keeping public keys pseudonymous. The network can see that a transaction occurred, but uninvolved parties lack the information to link the transaction with specific identities.

Chain’s implementation of the Chain Protocol, Chain Core, uses unique public keys for each transaction output to prevent observers from linking multiple outputs to one account. Individual keys are derived from a single master key to make key management safer. Chain Core implements a key derivation scheme that allows public and private keys to be derived from the common master key pair independently, therefore permitting creation of unique public keys without access to the master private key.

Programs that facilitate multi-party contracts may depend on sensitive data such as deadlines, prices and interest rates. These can be hidden via merkleized clauses, i.e. programs that contain only hashes of each branch, for which only the executed branches need to be revealed during execution. A smart contract could allow spending in one of two ways: by providing signatures from all parties on the new transaction (allowing parties to agree to how a contract resolved, while preserving privacy), or by revealing and executing the private smart contract code. This is similar to how contracts work in the real world—while enforcement in court typically requires the terms of the contract to be made public, most contracts are settled in private, with the public system only necessary as an implicit backstop.

The Chain Protocol can also be extended with additional confidentiality features, as covered in the [extensibility](https://github.com/chain/chain/blob/protocol/doc/whitepaper/chainprotocol.md#8-extensibility) and [roadmap](https://github.com/chain/chain/blob/protocol/doc/whitepaper/chainprotocol.md#10-roadmap) sections.

#### Consensus security

Security against forks — i.e., security against history-editing or double-spending — is enforced by the consensus mechanism.

Consensus protocol guarantees safety — the blockchain cannot be "forked" to show two different versions of history — as long as at least 2M - N - 1 block signers obey the protocol. The protocol guarantees liveness as long as the block generator and at least M block signers follow the protocol.

If signers do misbehave to fork the blockchain, this behavior can be detected and proven to an observer. Finally, any party that monitors the block headers can detect history-editing when it occurs.

The set of participants and the number of required block signatures can be configured differently for each blockchain network to provide different tradeoffs between liveness, efficiency, and safety.

#### Local policy

Block generators can implement local policies that filter out non-compliant transactions. This allows implementation of business or regulatory requirements (such as KYC/AML rules) that are outside the scope of the protocol. Local policies can be changed over time freely as they are not enforced and verified by the rest of the network nodes.

#### Compact proofs

The block header includes the Merkle root of the transactions in the block as well as the current UTXO state, which allows compact *Merkle proofs* of a given piece of state, such as whether a transaction has been accepted, or whether a particular UTXO remains unspent. Merkle proofs link a particular piece of state to a block header, from which a participant can check the timestamp and the block signers’ signatures. 

As a result, entities can participate in the network without seeing any transactions other than the ones they are involved in. They only need to validate block headers, along with compact proofs of the relevant transactions and/or UTXOs.

Compact proofs can also protect network participants against misbehaving block signers. If a block signer signs multiple blocks at the same height, participants can use the inconsistent signatures to construct *fraud proofs* to warn other nodes, or as evidence for enforcement out-of-band.

## 6. Scalability

The Chain Protocol makes several design decisions to support scalable transaction processing.

First, the UTXO model makes it possible to verify transactions in parallel — potentially on separate servers. This makes scaling easier, compared to a "programmable state-machine" model, such as Ethereum’s, which requires each transaction to be executed in sequence. Programs do not calculate or alter state — rather, each transaction fully specifies a state transition, and each program checks whether the specified state transition is valid. As a result, the program for each input can be validated independently.  Similarly, each transaction in a block can be validated in parallel (except that UTXOs must be created before they are spent, and each UTXO can be spent only once).

Second, the protocol does not require that participants keep track of the entire system’s state. ParticipantsPartipicants only need to remember the hashes of unspent UTXOs, since transactions include the details (such as asset ID, amount, and control program), which can be verified against the hash. This trades bandwidth for memory, making it easier for participants to avoid costly disk accesses.

Finally, compact proofs allow clients to validate only the parts of the blockchain that they care about, along with the block headers. This allows network participants to avoid processing and validating all transactions, as long as they trust a quorum of block signers. For additional security, clients could delegate the task of monitoring the entire blockchain to a server they trust.

## 7. Extensibility

The Chain Protocol is designed to be extensible to allow fixing bugs and adding new security features while keeping all network nodes compatible with the blockchain. Changes can be applied using a "soft fork" method that preserves both backward and forward compatibility — allowing outdated clients to continue to validate the blockchain. 

Blocks, assets, transactions, and programs each have version numbers and extensible fields. New versions can add additional features — such as adding an instruction to the VM, changing the VM completely, or introducing an entirely new accounting system and a new category of assets — or fix security flaws.

If a client does not recognize a version number for a field in a block or transaction, it treats it as "unknown" and assumes that it is valid. This allows outdated clients to continue to validate the blockchain and interpret the parts that it still understands. Some participants may choose to stop performing sensitive operations such as signing transactions or accepting payments if they detect an unknown version number and wish to upgrade the software before continuing operation.

## 8. Interoperability

The Chain Protocol can power multiple blockchain networks simultaneously. While these networks use the same protocol, their asset IDs are anchored to initial blocks of these networks which makes them globally unique.

Cross-ledger interaction is possible using cross-chain swap protocols, such as [Interledger](https://interledger.org/interledger.pdf). The CVM is capable of supporting the SHA-256, PREIMAGE, PREFIX, THRESHOLD, and ED25519 feature suites of [Crypto-Conditions](https://github.com/interledger/rfcs/blob/master/0002-crypto-conditions/0002-crypto-conditions.md). The Chain Protocol blockchains can interoperate not only with each other, but also with Bitcoin and other ledgers implementing similar programming features.

The Chain Protocol uses standard cryptographic tools such as SHA-2 and SHA-3 hash functions and the secure signature algorithm Ed25519.

## 9. Conclusion

This paper has presented Chain Protocol: a blueprint for a shared multi-asset ledger for modern financial networks. 

The protocol allows participants to issue and control assets on a ledger using digital signatures. Block signers follow a [federated consensus protocol](https://github.com/chain/chain/blob/protocol/doc/whitepaper/chainprotocol.md#5-consensus) to replicate a single copy of the ledger across all nodes. Assets can be issued or controlled using transactions, which are collected into blocks and sequenced to form a blockchain.

The protocol is meant to lay a foundation for future development, and was designed with flexibility, scalability, and extensibility in mind. 

