# Federated Consensus

* [Introduction](#introduction)
* [Threat model](#threat-model)
* [Key rotation](#key-rotation)
* [Membership changes](#membership-changes)
* [Policy enforcement](#policy-enforcement)
* [Disaster mitigation](#disaster-mitigation)
* [Future improvements](#future-improvements)

## Introduction

Federated consensus is a mechanism that ensures that only one blockchain is published and thefore double-spends are prevented. Consensus protocol is mostly segregated from the rest of the blockchain validation rules. Validation rules specify _which_ blockchain is valid, while consensus makes sure there is no more than _just one_ valid blockchain.

In this guide we discuss the design of the federated consensus used in Chain Protocol, its threat model, use cases and possible improvements.


## Threat model

TBD: Who trusts block signers with what: block signers, regular nodes, users of compact proofs.

TBD: Who trusts block generator with what: block signers, other nodes.


## Key management

TBD: keys and HSMs

TBD: individual key rotation

TBD: key delegation, NEXTPROGRAM and CHECKPREDICATE


## Membership changes

TBD: adding new member to the federation

TBD: removing a member from the federation


## Policy enforcement

TBD: local policy prevents txs from being recorded in the blockchain, but can be easily changed w/o upgrading other nodes.

TBD: each block signer may enforce their own policies regarding their own clients. Nodes may do the same for their clients and filter out non-confirming transactions (even if valid from the protocol perspective).

Since policy enforcement is not a part of the protocol rules, it is more flexible, can be changed at will and may use confidential information that should not be shared with the whole network. The cost of this flexibility is lower security: if some transactions “slip through” one node’s filter, they are recorded forever in the ledger and additional measures limiting subsequent transactions are necessary to mitigate any potential hazard.


## Disaster mitigation

TBD: VM upgrades with failstop phasing out of the obsolete consensus programs

TBD: failstop softforks

TBD: local policy violations

TBD: crypto algorithm disaster (QC/backdoors/bugs)

TBD: hard fork scenarios


## Future improvements

TBD: double-phase commitment

TBD: round-robin generator (for censorship resistance)

TBD: PBFT

TBD: Bitcoin checkpoints for long-term disaster mitigation

