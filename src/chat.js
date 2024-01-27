// const { spawn, message, result } = require("@permaweb/aoconnect");

const { spawn, message, result } = connection;




const myProcess = PROCESS_ID;


async function doSpawn() {
    const res = await connection.spawn({
        module: AOModule,
        scheduler: AOScheduler,
        signer,
        tags: [],
      });
        console.log(res);
        PROCESS_ID = res;

        console.log({PROCESS_ID});
}

async function getInbox() {
    const resdata = await sendAction("Eval", "Inbox");
    const inbox = resdata.Output.data;
    return inbox;
}


(async() => {

    // await doSpawn();

    const address = await getWalletAddress(wallet);
    console.log({address})
    const balance = await getWalletBalance(address);
    console.log({balance})

    const dataToUpload = "Hey";
    const res = await uploadToArweave(dataToUpload);
    console.log({res});

    const resdata = await sendAction("Echo", "Should be echoed");
    console.log({resdata});
    console.log(resdata.Messages);

    // const fetched = await fetchFromArweave(res);
    // console.log({fetched});

    // let { messages, spawns, output, error } = await result({
    //     // the arweave TXID of the message
    //     message: res,
    //     // the arweave TXID of the process
    //     process: PROCESS_ID,
    // });

    // console.log({messages, spawns, output, error});

    const inbox = await getInbox();
    console.log({inbox});
    const json = inbox.json;
    console.log({json});


})();