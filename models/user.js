'use strict'

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const UserSchema = Schema({
    name: String,
    surname: String,
    nick: String,
    email: String,
    password: String,
    role: String,
    image: String
});

module.exports = Mongoose.model('User', UserSchema);