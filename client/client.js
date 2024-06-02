//RemoteStartTransaction -> StartTransaction, RemoteStopTransaction -> StopTransaction, ReserveNow, CancelReservation
const { RPCClient } = require('ocpp-rpc');
const readline = require('readline');
const { DEFAULT_INTERVAL, INTERVAL_METER_VALUE } = require('./utils/constants');
require('dotenv').config();

const possibleStatus = {
    Available: 'Available',
    Charging: 'Charging',
    Finishing: 'Finishing',
    Reserved: 'Reserved',
    Unavailable: 'Unavailable',
    Faulted: 'Faulted'
};


var transactionId;
var reservationId;
var idTagReserved;
var timerHeartbeat;
var meterValuesInterval;
var energyDelivered = 0;
var expiryDate;
var expiryDateTimeout;
var status = possibleStatus.Available;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

const cli = new RPCClient({
    endpoint: `ws://${process.env.RPC_URL}:${process.env.RPC_PORT}`, // the OCPP endpoint URL
    identity: process.env.STATION_ID,             // the OCPP identity
    protocols: ['ocpp1.6'],          // client understands ocpp1.6 subprotocol
    strictMode: true,                // enable strict validation of requests & responses
});

async function bootNotification(){
    console.log("Sending BootNotification...");
    let res = await cli.call('BootNotification', {
        chargePointVendor: "ocpp-rpc",
        chargePointModel: "ocpp-rpc",
    });
    return res;
}

async function heartbeat(){
    console.log("Sending Heartbeat...");
    return await cli.call('Heartbeat', {});
}

async function statusNotification(){
    console.log("Sending StatusNotification");
    await cli.call('StatusNotification', {
        connectorId: 0,
        errorCode: "NoError",
        status: "Available",
    });
}

async function meterValues(){
    console.log("Sending MeterValues...");
    await cli.call('MeterValues', {
        connectorId: 0,
        transactionId: transactionId,
        meterValue: [{
            timestamp: new Date().toISOString(),
            sampledValue: [{
                value: energyDelivered + "",
                unit: "Wh",
                measurand: "Energy.Active.Import.Register"
            }]
        }]
    });

}

async function authorize(idTag){
    console.log("Sending Authorize...");
    const res = await cli.call('Authorize', {
        idTag: idTag,
    })
    return res.idTagInfo.status === "Accepted";
}

async function startTransaction(connectorId, idTag){
    if(status !== possibleStatus.Available && status !== possibleStatus.Reserved) 
        return false;
    console.log("Sending StartTransaction...");
    const res = await cli.call('StartTransaction', {
        connectorId: parseInt(connectorId),
        idTag: idTag,
        meterStart: energyDelivered,
        timestamp: new Date().toISOString()
    });

    if(res.idTagInfo.status !== "Accepted") 
        return false;

    transactionId = res.transactionId;
    return true;   
}

async function stopTransaction(transactionId, reasonCode){
    if(status !== possibleStatus.Charging)
        return false;

    console.log("Sending StopTransaction...");
    await cli.call('StopTransaction',{
        ...(reasonCode!==undefined && {reason: reasonCode}),
        meterStop: energyDelivered,
        timestamp: new Date().toISOString(),
        transactionId: transactionId,
    });
    status = possibleStatus.Available;
    energyDelivered = 0;
    transactionId = undefined;
    return true;
}


cli.handle('RemoteStartTransaction', async ({params}) => {
    console.log("Handling RemoteStartTransactions...");
    if(status === possibleStatus.Reserved && idTagReserved !== params.idTag){return {status: "Rejected"};}

    if((await authorize(params.idTag)) && (await startTransaction(0, params.idTag))){
        if(expiryDate){
            clearTimeout(expiryDateTimeout);
            expiryDateTimeout = undefined;
            expiryDate = undefined;
        } 
        status = possibleStatus.Charging;
        return {status: "Accepted"};
    }

    status = possibleStatus.Available;
    return {status: "Rejected"};
});


cli.handle('RemoteStopTransaction', async ({params}) => {
    console.log("Handling RemoteStopTransactions...");
    await stopTransaction(params.transactionId); // The server cannot block a RemoteStartTransaction
    return {status: 'Accepted'};
});

cli.handle('ReserveNow', ({params}) => {
    console.log("Handling ReserveNow...");
    if(status !== possibleStatus.Available) return {status: 'Rejected'};
    expiryDate = new Date(params.expiryDate);
    idTagReserved = params.idTag;
    reservationId = params.reservationId;
    status = possibleStatus.Reserved;
    expiryDateTimeout = setTimeout(async () => {
        console.log("Reservation expired");
        cancelReservation();
        await statusNotification();
    }, expiryDate.getTime() - new Date().getTime());

    return {status: 'Accepted'};
});

cli.handle('CancelReservation', ({params}) => {
    console.log("Handling CancelReservation...");
    if(status !== possibleStatus.Reserved) return {status: 'Rejected'};
    if(params.reservationId !== reservationId) return {status: 'Rejected'};
    clearTimeout(expiryDateTimeout);
    cancelReservation();
    return {status: 'Accepted'};
});

// connect to the OCPP server
async function connect(){
    await cli.connect();
    bootNotification().then((res) => {
        if(res.status !== 'Accepted'){
            console.log('BootNotification rejected');
            cli.close();
            process.exit(1);
        }
        console.log('Listening...');
        timerHeartbeat = setInterval(async () => {
            const res = await heartbeat();
        }, (res.interval !== undefined ? res.interval : DEFAULT_INTERVAL) * 1000);
        
        heartbeat();

        meterValuesInterval = setInterval(async () => {
            if(status === possibleStatus.Charging){
                await meterValues();
                energyDelivered += 500;
            }
        }, INTERVAL_METER_VALUE * 1000);
    });
}
connect();

function cancelReservation(){
    expiryDate = undefined;
    idTagReserved = undefined;
    reservationId = undefined;
    status = possibleStatus.Available;
    expiryDateTimeout = undefined;
}