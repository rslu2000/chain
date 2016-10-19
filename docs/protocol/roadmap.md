# Protocol Roadmap

Chain Protocol 1 is aimed at laying a foundation for future upgrades and large-scale deployment, so that more sophisticated security and confidentiality features can be introduced in later releases. Updates to the protocol are intended to be deployed as [soft forks](whitepaper.md#7-extensibility) therefore keeping it compatible with the already deployed software and applications. 

Disclaimer: this roadmap does not represent a commitment to specific features, deadlines or order of implementation. It also mostly focuses on protocol-level features and does not cover specific improvements to Chain Core or any additional software.

### Denial of service mitigation

* Explicit limits on number and size of blockchain entities (size of the blocks, number  of transactions etc).
* Fine-tuned runtime cost limits for the control and issuance programs.
* Improved consensus algorithm.

### Privacy

* Homomorphically encrypted amounts and asset identifiers: providing secrecy for balances and financial parameters of the transactions.
* Controlled traceability of the asset flow: hiding the link between transaction inputs and the outputs of the preceding transactions.

### Programmability

* Generalizing virtual machine for controlling assets on-chain and off-chain.
* Support for arithmetic on homomorphically encrypted values to improve confidentiality of on-chain programs.
* High-level programming language and formal verification toolkit.

### Scalability

* Reducing the amount of data to be stored by the nodes by requiring clients use more sophisticated proofs.
* More elaborate support for compact proofs to improve security of clients that do not validate the blockchain entirely.
* Additional support for merging blockchains.

