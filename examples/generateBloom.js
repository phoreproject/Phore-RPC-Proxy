const BloomFilter = require('bloom-filter'),
    tools = require("../tools");

function generateBloom(addresses) {
    let filter = BloomFilter.create(addresses.length, 0.001, 2147483649, 0);

    for (let i = 0; i < addresses.length; i++) {
        filter.insert(Buffer.from(addresses[i]));
    }
    return [tools.bytesToHex(filter.vData),  filter.nHashFuncs, filter.nTweak, filter.nFlags];
}


module.exports = {
    generateBloom: generateBloom
};


// example usage
// addresses from block: f130fc80fffec43e66f0d236d4d0ccb2cacf9284f0910256f6b39161b89a8375
console.log(...generateBloom(["PPXhkpAZcuKXdo8NF7XKoXUpo75RArKSfR", "PBDkkSiaRVKH7VWHvYSN1fznNmiRM7uqKK"]));
