"use strict";
const conn = require("../utils/db-connection");
const StationUsage = require("./StationUsage");
const { HEARTBEAT_TIME } = require("../utils/constants");

const STATUS = {
    FREE: 0,
    RESERVED: 1,
    USED: 2,
    DISMISSED: 3,
    BROKEN: 4,
    UNDEFINED: 5
};

async function getStatus(station, lastReservation, lastUsage) {
    if (station.last_heartbeat === null)
        return STATUS.UNDEFINED;
    if (station.dismissed)
        return STATUS.DISMISSED;
    // broken if no heartbeat for 3 times the heartbeat time
    if (station.last_heartbeat === null || station.last_heartbeat.getTime() + (HEARTBEAT_TIME * 3 * 1000) < Date.now())
        return STATUS.BROKEN;
    if (lastUsage && lastUsage.end_time === null)
        return STATUS.USED;    
    if (lastReservation && lastReservation.expiration_time && lastReservation.expiration_time.getTime() > Date.now())
        return STATUS.RESERVED;
    return STATUS.FREE;
}

class Station {
    constructor(
        id,
        name,
        lat,
        lon,
        price,
        dismissed,
        last_heartbeat,
        notes,
        description,
        status,
        connectors
    ) {
        this.id = id;
        this.name = name;
        this.lat = lat;
        this.lon = lon;
        this.price = price;
        this.dismissed = dismissed;
        this.last_heartbeat = last_heartbeat;
        this.notes = notes;
        this.description = description;
        this.status = status;
        this.connectors = connectors;
    }

    async save() {
        if (this.id) {
            // update existing station
            const sql =
                "UPDATE Station SET name = ?, lat = ?, lon = ?, price = ?, dismissed = ?, last_heartbeat = ?, notes = ?, description = ? WHERE id = ?";
            const [rows, _] = await conn.query(sql, [
                this.name,
                this.lat,
                this.lon,
                this.price,
                this.dismissed,
                this.last_heartbeat,
                this.notes,
                this.description,
                this.id,
            ]);
            if (rows.affectedRows == 0) return null;
            const lastReservation = await StationUsage.getLastReservationByStationId(
                this.id
            );
            const lastUsage = await StationUsage.getLastChargeByStationId(this.id);
            this.status = await getStatus(this, lastReservation, lastUsage);
        } else {
            // insert new station
            const sql =
                "INSERT INTO Station (name, lat, lon, price, dismissed, last_heartbeat, notes, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            const [rows, _] = await conn.query(sql, [
                this.name,
                this.lat,
                this.lon,
                this.price,
                this.dismissed,
                this.last_heartbeat,
                this.notes,
                this.description,
            ]);
            this.status = STATUS.UNDEFINED;
            if (rows.affectedRows == 0) return null;
            this.id = rows.insertId;
        }
        return this;
    }

    static async getAll() {
        const sql = "SELECT * FROM Station";
        const [rows, _] = await conn.query(sql);

        const allReservation = await StationUsage.getAllLastReservation();
        const allUsage = await StationUsage.getAllLastUsage();

        return await Promise.all(
            rows.map(async (row) => {
                const lastReservation = allReservation.find(
                    (reservation) => reservation.station_id === row.id
                );
                const lastUsage = allUsage.find(
                    (usage) => usage.station_id === row.id
                );
                const status = await getStatus(row, lastReservation, lastUsage);
                return new Station(
                    row.id,
                    row.name,
                    row.lat,
                    row.lon,
                    row.price,
                    row.dismissed == 1,
                    row.last_heartbeat,
                    row.notes,
                    row.description,
                    status,
                    undefined
                );
            })
        );
    }

    static async getById(id) {
        const sql = "SELECT * FROM Station WHERE id = ?";
        const [rows, _] = await conn.query(sql, [id]);
        if (rows.length == 0) return null;
        const row = rows[0];
        const lastReservation = await StationUsage.getLastReservationByStationId(row.id);
        const lastUsage = await StationUsage.getLastChargeByStationId(row.id);
        const status = await getStatus(row, lastReservation, lastUsage);

        return new Station(
            row.id,
            row.name,
            row.lat,
            row.lon,
            row.price,
            row.dismissed == 1,
            row.last_heartbeat,
            row.notes,
            row.description,
            status,
            undefined
        );
    }

    async addConnector(id){
        const sql = "INSERT INTO StationConnector (station_id, connector_id) VALUES (?, ?)";
        const [rows, _] = await conn.query(sql, [this.id, id]);
        return rows.affectedRows > 0;
    }

    async removeConnectors(){
        const sql = "DELETE FROM StationConnector WHERE station_id = ?";
        const [rows, _] = await conn.query(sql, [this.id]);
        return rows.affectedRows > 0;
    }
}

Station.STATUS = STATUS;

module.exports = Station;
