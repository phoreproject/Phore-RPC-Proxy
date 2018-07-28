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
        include_all: 0,
        only_mempool_not_confirmed: 1,
        only_confirmed: 2
    }
};