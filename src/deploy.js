const { init, uploadToArweave, getArweave, getWallet } = require("./common");

const fs = require("fs");

(async() => {

await init();

const arweave = getArweave();
const wallet = getWallet();

const source = fs.readFileSync("./source.lua").toString();
const sourceHash = await uploadToArweave(source, "text/plain");

const bundle = fs.readFileSync("./dist/bundle.js").toString();
const bundleHash = await uploadToArweave(bundle, "text/javascript");

let html = fs.readFileSync("./src/app/index.html").toString();
html = html.replace("../../dist/bundle.js", '/' + bundleHash);
html = html.replace("./dist/bundle.js", '/' + bundleHash);
html = html.replace("%%%SOURCE_LUA%%%", '/' + sourceHash);
const hash = await uploadToArweave(html, "text/html");
console.log('Deployed at https://arweave.net/' + hash);

// console.log({arweave})

// // show balance
// const address = await arweave.wallets.jwkToAddress(wallet);
// const balance = await arweave.wallets.getBalance(address);
// let winston = balance;
// let ar = arweave.ar.winstonToAr(balance);
// console.log({address, balance});

// const target = 'q-RR9fXWCubz3a5-KndWAjKblsG_qB-zXdcQibIL3lw';
// // send 0.1 AR to this address
// const tx = await arweave.createTransaction({
//     target: target,
//     quantity: arweave.ar.arToWinston('0.1'),
// });

// // sign the transaction
// const txsign = await arweave.transactions.sign(tx, wallet);

// // and send it off to the network
// const response = await arweave.transactions.post(txsign);
// console.log(response);
// console.log(response.status);

})();

