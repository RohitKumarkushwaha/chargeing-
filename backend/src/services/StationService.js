"use strict";
const Station = require("../models/Station");
const StationUsage = require("../models/StationUsage");
const RPCStationService = require("./RPCStationService");
const ConnectorService = require("./ConnectorService");
const UserService = require("./UserService");

class StationService {
    static async getAll(){
        let stations = await Station.getAll();
        await stations.forEach(async station => {
            station.connectors = await ConnectorService.getByStationId(station.id);
        });
        return stations;
    }

    static async getById(id){
        let station = await Station.getById(id);
        if(station === null)
            throw new Error("Station not found");
        station.connectors = await ConnectorService.getByStationId(station.id);
        return station;
    }
    
    static async getLastChargeByStationId(id){
        return await StationUsage.getLastChargeByStationId(id);
    }
    
    static async getLastReservationByStationId(id){
        return await StationUsage.getLastReservationByStationId(id);
    }
    
    static async reserve(id, userId){
        const station = await Station.getById(id);
        if (station === null)
            throw new Error("Station not found");
    
        if (station.status !== Station.STATUS.FREE)
            throw new Error("Station is currently not available for reservation");

        const lastUsage = await UserService.getLastUsageByUserId(userId);
        if(lastUsage !== null && lastUsage.end_time === null && lastUsage.expiration_time && lastUsage.expiration_time.getTime() > Date.now())
            throw new Error("You can't reserve a station while using another one");

        const stationUsage = new StationUsage(undefined, userId, id, undefined, undefined, new Date(), 0, station.price, false);        
        const savedStationUsage = await stationUsage.save();
    
        if (savedStationUsage !== null) {
            if(await RPCStationService.reserveNow(id, savedStationUsage.id, stationUsage.user_id, stationUsage.expiration_time)){
                return savedStationUsage;
            }else{
                console.log("ReserveNow Declined");
                savedStationUsage.deleted = true;
                savedStationUsage.save();
                throw new Error("ReserveNow Declined");
            }
        } else {
            throw new Error("Error reserving station");
        }
    }

    static async cancelReservation(id, userId){
        const station = await Station.getById(id);
        if (station === null)
            throw new Error("Station not found");
    
        if (station.status !== Station.STATUS.RESERVED)
            throw new Error("Station is currently not available for cancelling reservation");

        const lastStationReservation = await StationUsage.getLastReservationByStationId(id);

        if (lastStationReservation.user_id != userId)
            throw new Error("You can't cancel reservation for another user");
    
        lastStationReservation.deleted = true;
    
        const savedStationUsage = await lastStationReservation.save();
    
        if (savedStationUsage !== null) {
            if(await RPCStationService.cancelReservation(id, savedStationUsage.id)){
                return savedStationUsage;
            }else{
                console.log("cancelReservation Declined");
                savedStationUsage.deleted = false;
                savedStationUsage.save();
                throw new Error("cancelReservation Declined");
            }
        } else {
            throw new Error("Error cancelling reservation");
        }
    }

    static async startCharging(id, userId){
        const station = await Station.getById(id);
        const lastUsage = await UserService.getLastUsageByUserId(userId);
        const user = await UserService.getById(userId);

        if (user.balance <= 0 || user.balance < station.price)
            throw new Error("Insufficient funds");
        
        if (lastUsage !== null && lastUsage.station_id !== id && lastUsage.end_time === null && (!lastUsage.expiration_time || lastUsage.expiration_time.getTime() > Date.now()))
            throw new Error("You can't use a station while using another one");

        if (!await RPCStationService.remoteStartTransaction(id, userId))
            throw new Error("Error starting charging");
    }

    static async createTransaction(id, userId) {
        const station = await Station.getById(id);
        let savedStationUsage = null;
        if (station === null)
            throw new Error("Station not found");
    
        if (station.status === Station.STATUS.RESERVED) {
            const lastStationReservation = await StationUsage.getLastReservationByStationId(id);
    
            if (lastStationReservation.user_id != userId)
                throw new Error("Station is currently not available for charging");
    
            lastStationReservation.start_time = new Date();
            lastStationReservation.end_time = null;
    
            savedStationUsage = await lastStationReservation.save();
        } else {
            const stationUsage = new StationUsage();
            stationUsage.station_id = id;
            stationUsage.user_id = userId;
            stationUsage.start_time = new Date();
            stationUsage.price = station.price;
            stationUsage.deleted = false;
            stationUsage.kw = 0;

            savedStationUsage = await stationUsage.save();
        }

        return savedStationUsage;
    }

    static async stopCharging(id, userId){
        const station = await Station.getById(id);

        if (station === null)
            throw new Error("Station not found");

        if (station.status !== Station.STATUS.USED)
            throw new Error("Station is currently not available for stopping charging");

        const lastStationCharge = await StationUsage.getLastChargeByStationId(id);

        if (lastStationCharge.user_id != userId)
            throw new Error("You can't stop charging for another user");

        if (!await RPCStationService.remoteStopTransaction(id, lastStationCharge.id))
            throw new Error("Error stopping charging");

        return await StationUsage.getLastChargeByStationId(id);
    }

    static async add(name, lat, lon, price, dismissed, last_heartbeat, notes, description, connectors){
        const newStation = new Station(
            null,
            name,
            lat,
            lon,
            price,
            dismissed,
            last_heartbeat,
            notes,
            description,
            Station.STATUS.FREE,
            undefined
        );
        const addedStation = await newStation.save();
        if (addedStation !== null) {
            const addedConnectors = new Array();
            await connectors.forEach(async connector => {
                const connectorModel = await ConnectorService.getById(connector.id);
                if(connectorModel === null)
                    console.log(`Connector ${connector.id} not found`);
                if(await connectorModel.addToStation(addedStation.id))
                    addedConnectors.push(connectorModel);
                else
                    console.log(`Error adding connector ${connector.id} to station ${addedStation.id}`);
            });
            return addedStation.connectors = addedConnectors;
        }
        throw new Error("Error adding station");
    }

    static async update(id, name, lat, lon, price, power, dismissed, last_heartbeat, notes, description, connectors){
        const station = await Station.getById(id);
        if (station !== null) {
            if (name !== undefined)
                station.name = name;
            if (lat !== undefined)
                station.lat = lat;
            if (lon !== undefined)
                station.lon = lon;
            if (price !== undefined)
                station.price = price;
            if (power !== undefined)
                station.power = power;
            if (dismissed !== undefined)
                station.dismissed = dismissed;
            if (last_heartbeat !== undefined)
                station.last_heartbeat = last_heartbeat;
            if (notes !== undefined)
                station.notes = notes;
            if (description !== undefined)
                station.description = description;    
            const updatedStation = await station.save();
            if (updatedStation !== null) {
                if(connectors !== undefined){
                    await updatedStation.removeConnectors();
                    const addedConnectors = new Array();
                    await connectors.forEach(async connector => {
                        const connectorModel = await ConnectorService.getById(connector.id);
                        console.log(connectorModel)
                        if(connectorModel === null)
                            console.log(`Connector ${connector.id} not found`);
                        if(await connectorModel.addToStation(updatedStation.id))
                            addedConnectors.push(connectorModel);
                        else
                            console.log(`Error adding connector ${connector.id} to station ${addedStation.id}`);
                    });
                    updatedStation.connectors = addedConnectors;
                }
            
                return updatedStation;
            }
            throw new Error("Error updating station");
        }
        throw new Error("Station not found");
    }

    static async getReport(){
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        const rows = await StationUsage.getReport();

        const data = months.reduce((acc, month) => {
            acc[month] = {revenue: 0, usedPower: 0};
            return acc;
        }, {});


        rows.forEach(row => {
            data[months[row.month - 1]].revenue = row.total;
            data[months[row.month - 1]].usedPower = row.kw;
        });

        return data;
    }   
}

module.exports = StationService;
