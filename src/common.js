let Arweave = require("arweave");
if (typeof window !== 'undefined') {
    Arweave = Arweave.default;
}

let arweave;

const { connect, createDataItemSigner } = require("@permaweb/aoconnect");

let fs;
let signer;
let connection;
let wallet;

const init = async() => {
    // console.log({Arweave});
    arweave = Arweave.init({
        host: "arweave.net",
        port: 443,
        protocol: "https",
        timeout: 20000,
        logging: false,
    });
    
    if (typeof window === 'undefined') {
        // This code will not be included in the webpack bundle for the browser
        fs = require("fs");
    
        wallet = JSON.parse(
            fs.readFileSync("./wallet.json").toString(),
        );
        // console.log({wallet});
        signer = createDataItemSigner(wallet);    

        connection = await connect({
            //   MU_URL: "https://ao-mu-1.onrender.com",
            //   CU_URL: "https://ao-cu-1.onrender.com",
            //   GATEWAY_URL: "https://g8way.io",
        });        
    } else {
        wallet = window.arweaveWallet;
        await new Promise((resolve, reject) => {
            if (window.arweaveWallet) {
                signer = createDataItemSigner(window.arweaveWallet);
                resolve();
            } else {
                reject("No wallet found");
            }
        });

        const arweaveWallet = await window.arweaveWallet.connect([
            "ACCESS_ADDRESS",
            "SIGN_TRANSACTION",
        ]);

        console.log({arweaveWallet});

        window.wallet = wallet;
    }
};

const getWalletAddress = async(wallet) => {
    if (typeof window !== 'undefined') {
        return await wallet.getActiveAddress();
    }
    return arweave.wallets.jwkToAddress(wallet);
};

const getWalletBalance = async(address) => {
    const balance = await arweave.wallets.getBalance(address);
    let winston = balance;
    let ar = arweave.ar.winstonToAr(balance);
    return ar;        
}

async function uploadToArweave(data, contentType = "text/plain") {
    if (typeof window !== 'undefined') {
        wallet = undefined
    }
    const transaction = await arweave.createTransaction({ data }, wallet);
    transaction.addTag("Content-Type", contentType);
    await arweave.transactions.sign(transaction, wallet);
    const uploader = await arweave.transactions.getUploader(transaction);
    while (!uploader.isComplete) {
        await uploader.uploadChunk();
        console.log(
        `${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`,
        );
    }
    return transaction.id;
}

const getArweave = () => {
    return arweave;
}

const getWallet = () => {
    return wallet;
}

const fetchFromArweave = async (txid) => {
    const res = await arweave.transactions.getData(txid, {decode: true, string: true});
    return res;
}

module.exports = {
    connection,
    wallet,
    signer,
    getWalletAddress,
    getWalletBalance,
    uploadToArweave,
    getArweave,
    init,
    getWallet,
    fetchFromArweave
};