'use strict'

const Express = require('express');
const MessageController = require('../controllers/message');
const api = Express.Router();
const md_auth = require('../middlewares/authenticated');

api.post('/message', md_auth.ensureAuth, MessageController.saveMessage);
api.get('/my-messages/:page?', md_auth.ensureAuth, MessageController.getReceiverMessages);
api.get('/messages/:page?', md_auth.ensureAuth, MessageController.getEmmitMessages);
api.get('/unviewed-messages', md_auth.ensureAuth, MessageController.getUnviewedMessages);
api.get('/set-viewed-messages', md_auth.ensureAuth, MessageController.setViewedMessages);

// api.delete('/follow/:id', md_auth.ensureAuth, MessageController.deteleFolow);
// api.get('/following/:id?/:page?', md_auth.ensureAuth, MessageController.getFollowingUsers);
// api.get('/followed/:id?/:page?', md_auth.ensureAuth, MessageController.getFollowedUsers);
// api.get('/get-my-follows/:followed?', md_auth.ensureAuth, MessageController.getMyFollows);

module.exports = api;