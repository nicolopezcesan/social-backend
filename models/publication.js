'use strict'

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const PublicationSchema = Schema({
    text: String,
    file: String,
    created_at: String,
    user: { type: Schema.ObjectId, ref: 'User' }
});

module.exports = Mongoose.model('Publication', PublicationSchema);