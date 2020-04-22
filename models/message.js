'use strict'

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const MessageSchema = Schema({
    text: String,
    viewed: Boolean,
    created_at: String,
    emitter: { type: Schema.ObjectId, ref: 'User' },
    receiver: { type: Schema.ObjectId, ref: 'User' }
});

module.exports = Mongoose.model('Message', MessageSchema);