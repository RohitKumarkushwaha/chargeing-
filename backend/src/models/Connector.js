'use strict';
const conn = require('../utils/db-connection');

class Connector {
    constructor(id, name, power) {
        this.id = id;
        this.name = name;
        this.power = power;
    }

    async save() {
        if (this.id) {
            // update existing connector
            const sql = 'UPDATE Connector SET name = ?, power = ? WHERE id = ?';
            const [rows, _] = await conn.query(sql, [this.name, this.power, this.id]);
            if(rows.affectedRows == 0)
                return null;
        } else {
            // insert new connector
            const sql = 'INSERT INTO Connector (name, power) VALUES (?, ?)';
            const [rows, _] = await conn.query(sql, [this.name, this.power]);
            if(rows.affectedRows == 0)
                return null;
            this.id = rows.insertId;
        }
        return this;
    }

    static async getAll(token) {
        const sql = 'SELECT * FROM Connector';
        const [rows, _] = await conn.query(sql, [token]);
        if(rows.length == 0)
            return null;
        return rows.map(row => new Connector(row.id, row.name, row.power));
    }

    static async getById(id) {
        const sql = 'SELECT * FROM Connector WHERE id = ?';
        const [rows, _] = await conn.query(sql, [id]);
        if(rows.length == 0)
            return null;
        const row = rows[0];
        return new Connector(row.id, row.name, row.power);
    }

    static async getByStationId(stationId) {
        const sql = "SELECT * FROM Connector WHERE id IN (SELECT connector_id FROM StationConnector WHERE station_id = ?)";
        const [rows, _] = await conn.query(sql, [stationId]);
        return rows.map(row => new Connector(row.id, row.name, row.power));
    }

    async addToStation(stationId) {
        const sql = 'INSERT INTO StationConnector (station_id, connector_id) VALUES (?, ?)';
        const [rows, _] = await conn.query(sql, [stationId, this.id]);
        return rows.affectedRows >= 0;
    }
}

module.exports = Connector;