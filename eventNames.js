module.exports = {
    canals: {
        subscribeBlockRoom: "subscribeBlockRoom",
        subscribeBlockHashRoom: "subscribeBlockHashRoom",
        subscribeAddressRoom: "subscribeAddressRoom"
    },
    subscriptions: {
        subscribeBlockHash: "subscribeBlockHash",
        subscribeBlock: "subscribeBlock",
        subscribeAddress: "subscribeAddress",
        subscribeBloom: "subscribeBloom",
        unsubscribeAll: "unsubscribeAll",
    },
    rpc: {
        getblock: "getblock",
    },
    redis: {
        blocknotify: 'blocknotify',
        mempoolnotify: 'mempoolnotify',
    },
    includeTransactionType: {
        // IncludeAllTransactions - Include both confirmed and mempool transactions
        include_all: 0,
        // IncludeMempoolTransactions - Include only mempool transactions
        only_mempool_not_confirmed: 1,
        // IncludeConfirmedTransactions - Include only confirmed transaction
        only_confirmed: 2
    },
    bloomUpdateType: {
        // BloomUpdateNone indicates the filter is not adjusted when a match is found.
        None: 0,
        // BloomUpdateAll indicates if the filter matches any data element in a
        // public key script, the outpoint is serialized and inserted into the
        // filter.
        All: 1,
        // BloomUpdateP2PubkeyOnly indicates if the filter matches a data
        // element in a public key script and the script is of the standard
        // pay-to-pubkey or multisig, the outpoint is serialized and inserted
        // into the filter.
        P2PubkeyOnly: 2
    }
};