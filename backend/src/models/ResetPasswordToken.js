'use strict';
const conn = require('../utils/db-connection');

class ResetPasswordToken {
    constructor(id, email, token, generated_time, used) {
        this.id = id;
        this.email = email;
        this.token = token;
        this.generated_time = generated_time;
        this.used = used;
    }

    async save() {
        if (this.id) {
            // update existing station usage
            const sql = 'UPDATE ResetPasswordToken SET email = ?, token = ?, generated_time = ?, used = ? WHERE id = ?';
            const [rows, _] = await conn.query(sql, [this.email, this.token, this.generated_time, this.used, this.id]);
            if(rows.affectedRows == 0)
                return null;
        } else {
            // insert new station usage
            const sql = 'INSERT INTO ResetPasswordToken (email, token, generated_time, used) VALUES (?, ?, ?, ?)';
            const [rows, _] = await conn.query(sql, [this.email, this.token, this.generated_time, this.used]);
            if(rows.affectedRows == 0)
                return null;
            this.id = rows.insertId;
        }
        return this;
    }

    static async getByToken(token) {
        const sql = 'SELECT * FROM ResetPasswordToken WHERE token = ?';
        const [rows, _] = await conn.query(sql, [token]);
        if(rows.length == 0)
            return null;
        const row = rows[0];
        return new ResetPasswordToken(row.id, row.email, row.token, row.generated_time, row.used);
    }
}

module.exports = ResetPasswordToken;