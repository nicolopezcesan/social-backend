'use strict'

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const FollowSchema = Schema({
    user: { type: Schema.ObjectId, ref: 'User' },
    followed: { type: Schema.ObjectId, ref: 'User' }
});

module.exports = Mongoose.model('Follow', FollowSchema);