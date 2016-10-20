# Chain Protocol Glossary

This is a short collection of terms used in [Chain Protocol specification](readme.md).

**Chain OS:** A shorthand for Chain Open Standard, defined by the present specification.

**Chain Core:** A production-grade software implementation of Chain OS.

**Blockchain Network:** A network of block signers and other network nodes that validate transactions and the state of the shared ledger (the blockchain). Every network client is capable of authoring their own transactions controlled and authenticated by cryptographic keys and smart contracts. 

**Block Generator:** A network participant that selects transactions for inclusion in the block for quick reconciliation of double-spends. Block generator also signs blocks. In SBFT consensus mode, there is exactly one dedicated block generator.

**Block Signer:** A network participant that verifies transactions and signs blocks produced by *block generator*. Network usually has several block signers that form a *federation*.

**Federation:** A set of *block signers*.

**Block:** A timestamped ordered set of transactions and associated cryptographic commitment to the *blockchain state* produced as an effect of these transactions.

**Block Header:** A compact serialization of a *block* without transactions (but with a cryptographic commitment to them).

**Block Height:** A block’s serial number starting with 1.

**Initial Block:** The first block in the blockchain; its height is set to 1.

**Blockchain State:** A persistent data set transformed by every transaction that is being committed and timestamped by every block of the blockchain. State includes set of *unspent transaction outputs*, *asset definition pointers* and other data.

**Transaction:** (aka **tx**) A data structure that specifies a flow of *assets* from *inputs* to *outputs*.

**Transaction Output:** (aka **txout** or **txo**) A part of *transaction* that specifies destination for a certain amount of an *Asset*.

**Transaction Input:** (aka **txin**) A part of *transaction* that contains reference to *transaction output* and corresponding *Witness* data that authenticates the transaction.

**Unspent Transaction Output:** (aka **utxo**) An output that is marked as not-yet-spent in the blockchain state.

**Transaction Witness:** A part of *transaction input* that contains cryptographic signatures covering the transaction and additional information that helps verify transaction contents.

**Reference Data:** Arbitrary data associated with a transaction, transaction input or transaction output. Blocks commit only to hashes of reference data strings, actual storage is optional.

**Hash:** an output of a cryptographic hash function, in this document always SHA3-256, also called SHA3 for brevity.

**Signature:** a binary string that authenticates a message against a given public key.

**Asset:** A digital bearer token issued and transferred on blockchain and controlled by cryptographic keys and smart contracts.

**Asset ID:** Globally unique identifier of an asset, a pseudo-random 32-byte string. Asset ID is unique across all blockchains and all *asset versions*.

**Asset Version:** A version that defines a single accounting scheme for all the assets within its scope. New asset versions allow extending the protocol with new security or performance improvements without interfering with existing assets.

**Asset Definition:** An arbitrary binary string annotating a given asset ID.

**Transaction Hash** (aka **transaction ID**)**:** A unique identifier of a transaction as a result of hashing transaction contents excluding *input and output witness* data.

**Transaction Witness Hash:** A unique identifier of a transaction that includes *witness* data committed to by the blockchain (but not by individual transactions).

**Transaction Signature Hash:** A hash of transaction contents used to sign and verify the transaction.

**Block Signature Hash:** A hash of the block excluding Witness data used to sign and verify this block.

**Merkle Binary Tree:** A recursive tree where the nodes are hashes of their children.

**Merkle Patricia Tree:** A binary radix tree data structure with elements sorted lexicographically and hashes recursively defined over pairs of elements. Used for efficient proofs of presence or absence of certain elements.

**Merkle Path:** A list of left or right intermediate hashes that help computing a merkle root hash given an element of a merkle Tree. Used as a proof of presence of a certain element in a tree.

**Program:** A string containing compact bytecode instructions written for a stack-based VM. Programs are used to authenticate the entire blockchain (with consensus programs in blocks) and the flow of assets (with control programs and issuance programs in transactions).

**Program Arguments:** A list of binary strings that initialize the VM stack before executing predicate programs (either the consensus program in a block or the control program in a transaction). Some of the data may itself be a serialized executable program evaluated by the predicate.

**Merkleized Program:** A program that is split in two or more serialized subprograms organized in a merkle hash tree. The top level program contains a root hash, validation logic to verify a provided subprogram against that root hash and an EVAL opcode to actually evaluate the provided subprogram. Users may select a portion of a merkelized program to execute and provide a proof matching the root hash.

**Contract:** An informal name for a kind of program that contains multiple clauses and has separately specified parameters that define its state.

**Contract Clause:** A part of a contract describing conditions that allow transfer of the asset from the contract. Clauses can be kept secret unless triggered via merkleized programs.

**Contract Parameters:** Contracts may be generalized in reusable chunks of code (e.g. an orderbook contract) with specific details specified via parameters (e.g. price and a seller’s public key). Parameters also allow state transitions: contracts can restrict the flow of funds by requiring asset to be moved to the same contract with approved parameter values (e.g. transferrable collateral for a loan contract).






