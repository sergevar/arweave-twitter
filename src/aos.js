const AOModule = "FXNqc3uftQc78gvKHGJjHKhjTklEdk0zP3sp9TEJNyc";
const AOScheduler = "TZ7o7SIZ06ZEJ14lXwVtng1EtSx60QkPy-kh-kdAXog"
// let PROCESS_ID = "gU8TQV_8Unea-T2fQu9vE8ZfykWp6KUg5Dh76BM9d5o";
let PROCESS_ID = "v_BdeIplCAQkJqcZHDTHUu6vNb4s2NO7NFsJpEvJsks";

let spawned = false;

import {
    connect,
    createDataItemSigner,
    result,
} from "@permaweb/aoconnect";  

const connection = connect({
      MU_URL: "https://ao-mu-1.onrender.com",
      CU_URL: "https://ao-cu-1.onrender.com",
      GATEWAY_URL: "https://arweave.net", // "https://g8way.io",
});

async function doSpawn() {
    spawned = true;
    
    const signer = createDataItemSigner(window.arweaveWallet);

    PROCESS_ID = 'ahTrkxktyEtFsg2ueU8ut0p6DrVh5UoEiVgIT4n9n3g';
    return;

    const res = await connection.spawn({
        module: AOModule,
        scheduler: AOScheduler,
        signer,
        tags: [],
    });

    console.log(res);
    PROCESS_ID = res;

    console.log('PROCESS_ID', PROCESS_ID);

    // - source code
        
    const sourceLuaCodeResponse = await fetch(window.source_lua);
    const sourceLuaCode = await sourceLuaCodeResponse.text();

    // const lines = sourceLuaCode.split("\n\n");
    // console.log({sourceLuaCode});
    // for (let line of lines) {
    //     console.log({line});
    //     const res = await sendAction("Eval", line);
    //     console.log({res});
    // }
    await sendAction("Eval", sourceLuaCode);
}

const getResult = async(message, attempt = 0) => {
    try {
        const resdata = await result({
            process: PROCESS_ID,
            message: message,
          });
        return resdata;      
    } catch(e) {
        if (attempt > 10) {
            throw e;
        } else {
            console.log("Retrying...");
            return getResult(message, attempt + 1);
        }
    }
}

const sendAction = async(action, data, attempt) => {

    if (!spawned) await doSpawn();

    try {
        console.log("sendAction", {action, data});
        const signer = createDataItemSigner(window.arweaveWallet);
    
        const res = await connection.message({
            process: PROCESS_ID,
            signer,
            tags: [
                { name: "Action", value: action },
                { name: "Target", value: PROCESS_ID }
            ],
            data: data,
          });
    
          console.log({action, data, res});
    
          const resdata = await getResult(res);
    
          console.log({resdata});
          return resdata;    
    } catch(e) {
        if (attempt > 3) {
            throw e;
        } else {
            console.log("Retrying action...");
            return sendAction(action, data, attempt + 1);
        }
    }
}

async function getInbox() {
    const resdata = await sendAction("Eval", "Inbox");
    const inbox = resdata.Output.data;
    // return inbox;
    const json = inbox.json;
    console.log({json});
    return json;
}


export { sendAction, getInbox };