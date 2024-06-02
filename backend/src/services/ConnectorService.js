"use strict";
const Connector = require('../models/Connector');

class ConnectorService {
    static async getAll(){
        return await Connector.getAll();
    }

    static async getById(id){
        const connector = await Connector.getById(id);
        if(connector === null)
            throw new Error("Connector not found");
        return connector;
    }

    static async add(name, power){
        const connector = new Connector(null, name, power);
        const addedConnector = await connector.save();

        if(addedConnector !== null){
            return addedConnector;
        }
        throw new Error("Error adding connector");
    }

    static async update(id, name, power){
        const connector = await Connector.getById(id);
        if(connector !== null){
            if(name !== undefined)
                connector.name = name;
            if(power !== undefined)
                connector.power = power;
            const updatedConnector = await connector.save();
            if(updatedConnector !== null){
                return updatedConnector;
            }
            throw new Error("Error updating connector");
        }
        throw new Error("Connector not found");
    }

    static async getByStationId(stationId){
        return await Connector.getByStationId(stationId);;
    }
}

module.exports = ConnectorService;