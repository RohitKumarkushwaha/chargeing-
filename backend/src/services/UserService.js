"use strict";
const User = require("../models/User");
const ResetPasswordToken = require("../models/ResetPasswordToken");
const { emailValidRegex, strongPasswordRegex } = require("../utils/constants");
const jwt = require("jsonwebtoken");
const StationUsage = require("../models/StationUsage");
const nodeMailer = require("nodemailer");



function generateAccessToken(data, expirationTime) {
    if(expirationTime !== null) 
        return jwt.sign(data, process.env.JWT_SECRET_KEY, { expiresIn: `${expirationTime}s` }); 
    return jwt.sign(data, process.env.JWT_SECRET_KEY);
}

class UserService {
    static async getAll(){
        return await User.getAll();
    }

    static async getById(id){
        const user = await User.getById(id);
        if(user === null)
            throw new Error("User not found");
        return user;
    }

    static async update(id, name, surname, email, password, is_admin){
        const user = await User.getById(id);
        if(user === null)
            throw new Error("User not found");

        if (name !== undefined) user.name = name;
        if (surname !== undefined) user.surname = surname;
        if (email !== undefined) user.email = email;
        if (password !== undefined) {
            user.password = password;
            user.token_reset_time = new Date();
            user.token_reset_time.setMilliseconds(0);
        }
        if (is_admin !== undefined) user.is_admin = is_admin;
        
        const updatedUser = await user.save();
        if (updatedUser !== null) {
            if (password !== undefined) {
                const token = generateAccessToken({ userId: updatedUser.id, isAdmin: updatedUser.is_admin }, null);
                                return { token: token };
            } else {
                return { message: "User updated" };
            }
        } else {
            throw new Error("Error updating user");
        }
    }    
    
    static async add(name, surname, email, password, is_admin){
        if(!email.match(emailValidRegex))
            throw new Error("Invalid email address");
        if(!password.match(strongPasswordRegex))
            throw new Error("Invalid password");
        if(await User.getByEmail(email) !== null)
            throw new Error("Email already registered");

        const user = new User(null, name, surname, email, password, 10000, new Date(), is_admin);
        const newUser = await user.save();
        
        if(newUser !== null) {
            const token = generateAccessToken({ userId: newUser.id, isAdmin: newUser.is_admin }, null);
            return { token: token };
        } else {
            throw new Error("Error adding user");
        }
    }

    static async login(email, password){
        const user = await User.login(email, password);
        if(user === null)
            throw new Error("Invalid credentials");
        const token = generateAccessToken({
            userId: user.id,
            isAdmin: user.is_admin,
        }, null);
        return { token: token };
    }

    static async resetPasswordToken(email){
        if(!email){
            throw new Error("Missing email");
        }

        const user = await User.getByEmail(email);
        if(user === null){
            throw new Error("Email not registered");
        }
    
        const transporter = nodeMailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    
        const token = generateAccessToken({
            email: email
        }, 900);;
    
        const resetPasswordToken = new ResetPasswordToken(null, email, token, new Date(), false);
        resetPasswordToken.save();
    
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Reset your password',
            text: `Hello, you can reset your password here: http://${process.env.API_URL}:${process.env.PORT}/auth/resetPasswordPage?token=${token}`
        };
    
        try{
            await transporter.sendMail(mailOptions);
            return { message: "Password reset link sent to your email" };
        }catch(error){
            throw new Error("Error resetting password. Please try again later.");
        }
    }

    static async resetPassword(email, password, token){
        if(!email)
            throw new Error("Missing email ");
        if(!password)
            throw new Error("Missing password");
        if(!password.match(strongPasswordRegex))
            throw new Error("Invalid password");

        let tokenModal = await ResetPasswordToken.getByToken(token);
        if(token === null || tokenModal.used)
            throw new Error("Invalid token");
        
    
        const user = await User.getByEmail(email);
        if (user !== null) {
            tokenModal.used = true;
            tokenModal.save();
            user.password = password;
            user.token_reset_time = new Date();
            const updatedUser = await user.save();
            if(updatedUser !== null){
                return { message: "Password updated" };
            } else {
                throw new Error("Error updating password");
            }
        } else {
            throw new Error("Email not registered");
        }
    }

    static async getLastUsageByUserId(id){
        await User.getById(id);
        const last_charge = await StationUsage.getLastChargeByUserId(id);
        const last_reservation = await StationUsage.getLastReservationByUserId(id);

        if (last_charge === null && last_reservation === null)
            return null;

        if (last_charge === null)
            return last_reservation;
        if (last_reservation === null)
            return last_charge;

        if (last_charge.start_time > last_reservation.reservation_time)
            return last_charge;
        else
            return last_reservation;
    }
}

module.exports = UserService;
