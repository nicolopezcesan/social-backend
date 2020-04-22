'use strict'

const Express = require('express');
const FollowController = require('../controllers/follow');
const api = Express.Router();
const md_auth = require('../middlewares/authenticated');

api.get('/pruebas', md_auth.ensureAuth, FollowController.prueba);

api.post('/follow', md_auth.ensureAuth, FollowController.saveFollow);
api.delete('/follow/:id', md_auth.ensureAuth, FollowController.deteleFolow);
api.get('/following/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowingUsers);
api.get('/followed/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowedUsers);
api.get('/get-my-follows/:followed?', md_auth.ensureAuth, FollowController.getMyFollows);

module.exports = api;