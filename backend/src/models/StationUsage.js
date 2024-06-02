'use strict';
const conn = require('../utils/db-connection');
const { RESERVATION_TIME } = require("../utils/constants");

class StationUsage {
    constructor(id, user_id, station_id, start_time, end_time, reservation_time, kw, price, deleted) {
        this.id = id;
        this.user_id = user_id;
        this.station_id = station_id;
        this.start_time = start_time;
        this.end_time = end_time;
        this.reservation_time = reservation_time;
        this.kw = kw;
        this.price = price;
        this.deleted = deleted;
        this.expiration_time = !this.start_time && this.reservation_time ? new Date(this.reservation_time.getTime() + (RESERVATION_TIME * 1000)) : undefined;
    }

    async save() {
        if (this.id) {
            // update existing station usage
            const sql = 'UPDATE StationUsage SET user_id = ?, station_id = ?, start_time = ?, end_time = ?, reservation_time = ?, kw = ?, price = ?, deleted = ? WHERE id = ?';
            const [rows, _] = await conn.query(sql, [this.user_id, this.station_id, this.start_time, this.end_time, this.reservation_time, this.kw, this.price, this.deleted, this.id]);
            if(rows.affectedRows == 0)
                return null;
        } else {
            // insert new station usage
            const sql = 'INSERT INTO StationUsage (user_id, station_id, start_time, end_time, reservation_time, kw, price, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            const [rows, _] = await conn.query(sql, [this.user_id, this.station_id, this.start_time, this.end_time, this.reservation_time, this.kw, this.price, this.deleted]);
            if(rows.affectedRows == 0)
                return null;
            this.id = rows.insertId;
        }
        return this;
    }

    static async getAll() {
        const sql = 'SELECT * FROM StationUsage';
        const [rows, _] = await conn.query(sql);
        return rows.map(row => new StationUsage(row.id, row.user_id, row.station_id, row.start_time, row.end_time, row.reservation_time, row.kw, row.price, row.deleted));
    }

    static async getAllLastReservation() {
        const sql = `
            SELECT * 
            FROM StationUsage AS su1 
            WHERE reservation_time = (
                SELECT MAX(reservation_time)
                FROM StationUsage AS su2
                WHERE su1.station_id = su2.station_id AND su1.start_time is null and deleted=false
            ) 
        `;
        const [rows, _] = await conn.query(sql);
        return rows.map(row => new StationUsage(row.id, row.user_id, row.station_id, row.start_time, row.end_time, row.reservation_time, row.kw, row.price, row.deleted));
    }
  
    static async getAllLastUsage() {
        const sql = `
            SELECT * 
            FROM StationUsage AS su1 
            WHERE start_time = (
                SELECT MAX(start_time)
                FROM StationUsage AS su2
                WHERE su1.station_id = su2.station_id and su1.start_time is not null and deleted=false
            )
        `;
        const [rows, _] = await conn.query(sql);
        return rows.map(row => new StationUsage(row.id, row.user_id, row.station_id, row.start_time, row.end_time, row.reservation_time, row.kw, row.price, row.deleted));
    }
    
    static async getLastReservationByStationId(station_id) {
        const sql = 'SELECT * FROM StationUsage WHERE station_id = ? and reservation_time is not null and start_time is null and deleted=false ORDER BY reservation_time DESC LIMIT 1';
        const [rows, _] = await conn.query(sql, [station_id]);
        if(rows.length == 0)
            return null;
        const row = rows[0];
        return new StationUsage(row.id, row.user_id, row.station_id, row.start_time, row.end_time, row.reservation_time, row.kw, row.price, row.deleted);
    }

    static async getLastChargeByStationId(station_id) { 
        const sql = 'SELECT * FROM StationUsage WHERE station_id = ? and start_time is not null and deleted=false ORDER BY start_time DESC LIMIT 1';
        const [rows, _] = await conn.query(sql, [station_id]);
        if(rows.length == 0)
            return null;
        const row = rows[0];
        return new StationUsage(row.id, row.user_id, row.station_id, row.start_time, row.end_time, row.reservation_time, row.kw, row.price, row.deleted);
    }

    static async getLastUsageByTransactionId(transaction_id) {
        const sql = 'SELECT * FROM StationUsage WHERE id = ?';
        const [rows, _] = await conn.query(sql, [transaction_id]);
        if(rows.length == 0)
            return null;
        const row = rows[0];
        return new StationUsage(row.id, row.user_id, row.station_id, row.start_time, row.end_time, row.reservation_time, row.kw, row.price, row.deleted);
    }

    static async getLastReservationByUserId(user_id) {
        const sql = 'SELECT * FROM StationUsage WHERE user_id = ? and reservation_time is not null and start_time is null and deleted=false ORDER BY reservation_time DESC LIMIT 1';
        const [rows, _] = await conn.query(sql, [user_id]);
        if(rows.length == 0)
            return null;
        const row = rows[0];
        return new StationUsage(row.id, row.user_id, row.station_id, row.start_time, row.end_time, row.reservation_time, row.kw, row.price, row.deleted);
    }

    static async getLastChargeByUserId(user_id) { 
        const sql = 'SELECT * FROM StationUsage WHERE user_id = ? and start_time is not null and deleted=false ORDER BY start_time DESC LIMIT 1';
        const [rows, _] = await conn.query(sql, [user_id]);
        if(rows.length == 0)
            return null;
        const row = rows[0];
        return new StationUsage(row.id, row.user_id, row.station_id, row.start_time, row.end_time, row.reservation_time, row.kw, row.price, row.deleted);
    }

    static async getReport() {

        const sql = `
            SELECT SUM(kw * price) as total, SUM(kw) as kw, MONTH(start_time) as month
            FROM stationusage
            WHERE start_time IS NOT NULL AND YEAR(start_time) = YEAR(NOW())
            GROUP BY month`;

        const [rows, _] = await conn.query(sql);

        return rows;
    }
}

module.exports = StationUsage;