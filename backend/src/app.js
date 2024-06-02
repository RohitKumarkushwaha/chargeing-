"use strict";
require("dotenv").config();
const express = require("express");
const stationRouter = require("./routes/station");
const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const connectorRouter = require("./routes/connector");
const RPCStation = require("./services/RPCStationService");
const StationService = require("./services/StationService");
const { HEARTBEAT_TIME } = require("./utils/constants");

const { RPCServer, createRPCError } = require('ocpp-rpc');

const server = new RPCServer({
    protocols: ['ocpp1.6'], // server accepts ocpp1.6 subprotocol
    strictMode: true,       // enable strict validation of requests & responses
});

server.auth((accept, reject, handshake) => {
    // accept the incoming client
    accept();
});

server.on('client', async (client) => {
    console.log(`Station ${client.identity} connected!`);
    RPCStation.addStation(client);

    client.handle('BootNotification', ({params}) => {
        console.log(`Handling BootNotification from ${client.identity}...`);

        // respond to accept the client
        return {
            status: "Accepted",
            interval: HEARTBEAT_TIME, 
            currentTime: new Date().toISOString()
        };
    });
    
    client.handle('Heartbeat', async ({params}) => {
        console.log(`Handling Heartbeat from ${client.identity}...`);
        const station = await StationService.getById(client.identity);
        station.last_heartbeat = new Date();
        await station.save();
        // respond with the server's current time.
        return {
            currentTime: new Date().toISOString()
        };
    });
    
    client.handle('StatusNotification', ({params}) => {
        console.log(`Handling StatusNotification from ${client.identity}...`);
        return {};
    });

    client.handle('MeterValues', async ({params}) => {
        console.log(`Handling MeterValues from ${client.identity}...`);
        const valueEnergy = params.meterValue[0].sampledValue[0].value;
        const lastStationUsage = await StationService.getLastChargeByStationId(client.identity);

        const user = await UserService.getById(lastStationUsage.user_id);

        if (user.balance < lastStationUsage.price * parseFloat(valueEnergy)/1000 || user.balance <= 0) {
            await RPCStationService.remoteStopTransaction(parseInt(client.identity), lastStationUsage.id);

            lastStationUsage.end_time = new Date();
            await lastStationUsage.save();
        }

        lastStationUsage.kw = parseFloat(valueEnergy)/1000;
        await lastStationUsage.save();
        return {};
    });

    client.handle('Authorize', ({params}) => {
        console.log(`Handling Authorize from ${client.identity}...`);
        return {
            idTagInfo: {
                status: "Accepted"
            }
        };
    });

    client.handle('StartTransaction', async ({params}) => {
        console.log(`Handling StartTransaction from ${client.identity}...`);        
        const newUsage = await StationService.createTransaction(client.identity, params.idTag);
        return {
            transactionId: newUsage.id,
            idTagInfo: {
                status: "Accepted"
            }
        };
    });

    client.handle('StopTransaction', async ({params}) => {
        console.log(`Handling StopTransaction from ${client.identity}...`);

        const valueEnergy = params.meterStop;

        const lastStationUsage = await StationService.getLastChargeByStationId(client.identity);

        lastStationUsage.kw = valueEnergy / 1000;
        lastStationUsage.end_time = new Date();

        const user = await UserService.getById(lastStationUsage.user_id);
        user.balance -= lastStationUsage.price * lastStationUsage.kw;

        await user.save();
        await lastStationUsage.save();

        return {
            idTagInfo: {
                status: "Accepted"
            }
        }  
    });

    client.handle(({method, params}) => {
        // This handler will be called if the incoming method cannot be handled elsewhere.
        // throw an RPC error to inform the server that we don't understand the request.
        console.log(`Handling not implemented method from ${client.identity}...`)
        throw createRPCError("NotImplemented");
    });
});

const rpcPort = process.env.RPC_PORT || 3001;
server.listen(rpcPort);
console.log(`Listening RPC Server on port ${rpcPort}...`)

const cors = require("cors");
var path = require('path');
const e = require("express");
const UserService = require("./services/UserService");
const RPCStationService = require("./services/RPCStationService");

const app = express();

app.use(
    cors({
        origin: `http://localhost:${process.env.FE_PORT}`,
    })
);

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');


app.use(express.json());

app.use("/station", stationRouter);
app.use("/user", userRouter);
app.use("/auth", authRouter);
app.use("/connector", connectorRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // send the error as json
    res.status(err.status || 500);
    res.json({ error: err.message });
});

// start node server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));

module.exports = app;
