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
console.log(...generateBloom(["PPXhkpAZcuKXdo8NF7XKoXUpo75RArKSfR", "PBDkkSiaRVKH7VWHvYSN1fznNmiRM7uqKK"]));
