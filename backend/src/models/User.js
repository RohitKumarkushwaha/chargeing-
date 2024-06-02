"use strict";
const conn = require("../utils/db-connection");
const bcrypt = require("bcrypt");
const { getById } = require("./station");

class User {
    constructor(
        id,
        name,
        surname,
        email,
        password,
        balance,
        token_reset_time,
        is_admin
    ) {
        this.id = id;
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.password = password;
        this.balance = balance;
        this.token_reset_time = token_reset_time;
        this.is_admin = is_admin;
    }

    async save() {
        if (this.id) {
            // update existing user
            const sql =
                "UPDATE User SET name = ?, surname = ?, email = ?, password = ?, balance = ?, token_reset_time = ?, is_admin = ? WHERE id = ?";
            const [rows, _] = await conn.query(sql, [
                this.name,
                this.surname,
                this.email,
                await bcrypt.hash(this.password, 10),
                this.balance,
                this.token_reset_time,
                this.is_admin,
                this.id,
            ]);
            if (rows.affectedRows == 0) return null;
        } else {
            // insert new user
            const sql =
                "INSERT INTO User (name, surname, email, password, balance, token_reset_time, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)";
            const [rows, _] = await conn.query(sql, [
                this.name,
                this.surname,
                this.email,
                await bcrypt.hash(this.password, 10),
                this.balance,
                this.token_reset_time,
                this.is_admin,
            ]);
            if (rows.affectedRows == 0) return null;
            this.id = rows.insertId;
        }
        this.password = "";
        return this;
    }

    static async login(email, password) {
        const sql = "SELECT * FROM User WHERE email = ?";
        const [rows, _] = await conn.query(sql, [email]);
        if (rows.length == 0) return null;
        const row = rows[0];
        if (await bcrypt.compare(password, row.password))
            return new User(
                row.id,
                row.name,
                row.surname,
                row.email,
                "",
                row.balance,
                row.token_reset_time,
                row.is_admin
            );
        else return null;
    }

    static async getById(id) {
        const sql = "SELECT * FROM User WHERE id = ?";
        const [rows, _] = await conn.query(sql, [id]);
        if (rows.length == 0) return null;
        const row = rows[0];
        return new User(
            row.id,
            row.name,
            row.surname,
            row.email,
            "",
            row.balance,
            row.token_reset_time,
            row.is_admin
        );
    }

    static async getByEmail(email) {
        const sql = "SELECT * FROM User WHERE email = ?";
        const [rows, _] = await conn.query(sql, [email]);
        if (rows.length == 0) return null;
        const row = rows[0];
        return new User(
            row.id,
            row.name,
            row.surname,
            row.email,
            "",
            row.balance,
            row.token_reset_time,
            row.is_admin
        );
    }

    static async getAll() {
        const sql = "SELECT * FROM User";
        const [rows, _] = await conn.query(sql);
        return rows.map(
            (row) =>
                new User(
                    row.id,
                    row.name,
                    row.surname,
                    row.email,
                    "",
                    row.balance,
                    row.token_reset_time,
                    row.is_admin
                )
        );
    }
}

module.exports = User;
