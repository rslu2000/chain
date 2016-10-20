# Federated Consensus

* [Introduction](#introduction)
* [Algorithm overview](#algorithm-overview)
* [Integrity guarantees](#integrity-guarantees)
* [Liveness guarantees](#liveness-guarantees)
* [Key management](#key-management)
* [Membership changes](#membership-changes)
* [Policy enforcement](#policy-enforcement)
* [Future improvements](#future-improvements)


## Introduction

Federated consensus is a mechanism that ensures that only one blockchain is published and thefore double-spends are prevented. Consensus protocol is mostly segregated from the rest of the blockchain validation rules. Validation rules specify _which_ blockchain is valid, while consensus makes sure there is no more than _just one_ valid blockchain.

In this guide we discuss the design of the federated consensus used in Chain Protocol, its goals, use cases, threat model and possible improvements.


## Algorithm overview

The federation consists of a single _block generator_ and a group of _block signers_. 

Block generator:

* receives transactions from network, 
* filters out transactions that are invalid,
* filters out transactions that do not pass local policy checks,
* aggregates them in a new block,
* sends the proposed block to block signers for approval.

Each block signer:

* verifies that the proposed block is signed by the generator,
* verifies that it follows the protocol rules (excluding checks of block signers’ signatures),
* verifies that it extends their chain (i.e. the block does not fork the chain),
* verifies that the block contains an acceptable _consensus program_ (that authenticates the next block),
* signs the block,
* and, if the required amount of signatures is collected, broadcasts the block to the rest of the network nodes.

Once the block is signed by all block signers and published, all network nodes validate that block (including block signers’ signatures), while the block generator is assembling the next block with more transactions.

[sidenote]

For detailed description of the consensus protocol, see [Federated Consensus Protocol](../spec/consensus.md) specification.

Chain VM supports block introspection instructions that allow customizing consensus programs. See [Chain VM](../spec/vm1.md#block-context) specification for details.

[/sidenote]

Each block is authenticated to the network via _consensus program_ declared in the previous block. Consensus program represents a predicate that must be satisifed by _program arguments_ in the subsequent block. A typical consensus programs implements “M-of-N multisignature” rule where M is the number of required signatures and N is the number of block signers. Public keys are included within the program and the signatures are provided in the arguments list. Blocks may reuse the same consensus program or change it arbitrarily as long as block signers approve the change.

Network nodes validate only block signers’ signatures, excluding block generator’s signature. This allows block signers evolve the consensus mechanism without any additional support from the rest of the network.


## Integrity guarantees

Chain Protocol prescribes a number of context-free rules that define which transactions are valid (e.g. the amounts balance, signatures are correct etc). However, additional rules are necessary to ensure that:

* transactions do spend the same asset twice,
* transactions are final,
* there is only one version of the blockchain.

All network nodes validate all blocks for double spending by tracking a set of *unspent transaction outputs* (“UTXO set”). Every transaction is allowed to spend only existing unspent outputs. Once the transaction is applied, spent outputs are removed from the UTXO set and the new outputs are added.

Network nodes also verify that blocks link to each other and are correctly signed. If a node detects two correctly signed blocks at one point in history, it stops immediately and reports an integrity violation to the administrator. The node refuses to process transactions from either of two blocks and waits for out-of-band resolution. As a result, network nodes may experience double-spents or have their transactions if both conditions are satisfied:

[sidenote]

Note that a node should fail-stop even if one of two blocks is correctly signed, but contains invalid transactions (e.g. double spends, or transactions not satisfying control and issuance programs). This provides protection for users of compact proofs that do not validate all transactions. Such users rely on block signers’ signatures to verify that a certain transaction is included in the blockchain.

[/sidenote]

1. a quorum of block signers signs two blocks with a common ancestor (“forks the blockchain”),
2. block signers perform a partition attack to prevent each part of the network seeing both blocks.

Honest block signers are therefore responsible for not signing two forks of the blockchain. They do so by simply refusing to sign an alternative version of a proposed block by a block generator. Dishonest block generator is not able to fork the blockchain. An attempt to do so may lead to a deadlock: block signers will not be able to reach a quorum and will need an out-of-band agreement about the block to finalize and publish.


## Liveness guarantees

Simplicity and performance of the consensus protocol comes with a liveness tradeoff. While the block generator is not capable of forking the blockchain, it has control over network liveness: if the block generator crashes or otherwise stops producing new blocks, the blockchain halts. The block generator can also deadlock the network by sending inconsistent blocks to different block signers. Additionally, the block generator has control over the block timestamp, and can produce blocks with artificially “slow” timestamps.

Having block signers responsible for preventing blockchain forks, block generator itself can be made highly available using traditional replication methods, without using a Byzantine-fault-tolerant agreement protocol.

A quorum of block signers can temporarily stop the network by refusing to sign new blocks. The can also permanently deadlock other nodes by attempting to fork a blockchain, provided these nodes receive blocks from both chains (i.e. if network is not partitioned). If deadlock occurs among block signers or on the entire network level, it must be resolved manually using an out-of-band agreement.


## Key management

Block generator and block signers store signing keys in the HSM that prevents leakage of long-term cryptographic material. If HSM needs to be upgraded, or key needs to be rotated for any reason, block signers and block generator may agree out of band on a new consensus program and start using it in new blocks beginning at a certain timestamp.

Consensus program is evaluated by Chain VM that supports introspection instructions [NEXTPROGRAM](../spec/vm1.md#nextprogram) and [CHECKPREDICATE](../spec/vm1.md#checkpredicate). These instructions enable more sophisticated schemes such as temporary key delegation or automatic rotation by introducing additional checks directly inside the consensus program.

[Blockchain Programs](blockchain-programs.md) paper discusses in detail different ways to use programs and instrospection instructions to build secure schemes on top of blockchain.


## Membership changes

Members can be added and removed from the federation of block signers using the same techniques as described in the key management session. As any change to consensus program, it requires a quorum of existing block signers.

Extra care must be taken when changing membership in order to avoid changes to liveness or integrity guarantees. For instance, if a member is removed from a 5-of-7 multisignature consensus program and threshold is not lowered, the rule becomes 5-of-6 and the network can tolerate downtime of only one block signer instead of two. However, if the threshold is lowered to 4-of-6, then it can still tolerate two crashes, but only one byzantine failure among block signers. Generally, it is recommended to always maintain the stable federation size, especially if it is relatively small.


## Policy enforcement

Block generator may apply local policy to filter out non-compliant transactions. Since policy enforcement is not a part of the protocol rules, it is more flexible, can be changed at will and may use confidential information that should not be shared with the whole network. The cost of this flexibility is lower security: if some transactions “slip through” one node’s filter, they are recorded forever in the ledger and additional measures limiting subsequent transactions are necessary to mitigate any potential damage.


## Future improvements

Consensus mechanism may be improved without disrupting the network. This section provides a brief overview of improvements that are desireable and may be introduced in future versions of Chain Protocol and Chain Core software.


#### Double-phase commitment 

The current consensus mechanism does not allow block signers to enforce their own local policies and refuse to sign otherwise valid blocks. If a signer wants to re-negotiate the block content with a block generator, other signers who already signed the first version of that block cannot safely sign another version as this undermines integrity guarantees.

However, if block signers use two rounds of signing: with _private signatures_ first and then, after reaching quorum, signing with _public signatures_, then they are able to reject proposed blocks and re-sign alternative versions any number of times. Only _public signatures_ must be used only on one block.


#### Fraud proofs protocol

Nodes may implement a stronger protection against blockchain forks by not relying exclusively on a quorum of block signers. In addition to existing fail-stop rules, nodes may communicate directly with other nodes using a peer-to-peer protocol to verify that they see the same chain of block headers. When a fork is detected, nodes let each other know about it. And if any given node cannot reach a well-known peer, it may pause processing blockchain assuming that network partition attack could be under way. This makes such attacks more difficult: faulty block signers must isolate not one node, but a whole group of interconnected nodes to prevent them from learning about existance of an alternative chain. 

#### Byzantine fault tolerance

Consensus mechanism based on a single block generator is not ideal for all scenarios. To improve liveness guarantees while not compromizing security, a more sophisticated byzantine agreement protocol is requred. Existing proposals such as PBFT, Tendermint and Byzcoin demonstrate potential in this area.

#### Bitcoin checkpoints

The present consensus mechanism, as well as more sophisticated byzantine consensus protocols, assume that quorum (majority) of federation members are honest and their keys are well-protected. However, if keys used in the older blocks ever become compromised, it is possible to fork the blockchain in the arbitrary point in the past.

One way to offer a long-term blockchain integrity is to periodically commit recent block hash to Bitcoin blockchain. This way, every node may additionally verify that a specific version of blockchain is checkpointed in Bitcoin and therefore even a compromised quorum of keys cannot produce a valid fork. As a result, the quorum of block signers must be trusted to not fork the network for only a limited time interval, on the order of hours, instead of years.


