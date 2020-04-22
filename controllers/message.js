'use strict'

// const path = require('path');
// const fs = require('fs'); // Librería File System de Node Js
const moment = require('moment');
const mongoosePaginate = require('../libraries/mongoose-pagination');

// const Publication = require('../models/publication');
const User = require('../models/publication');
const Follow = require('../models/follow');
const Message = require('../models/message');

function saveMessage(req, res) {
    let params = req.body;

    if (!params.text || !params.receiver) return res.status(200).send({ message: 'Envía los datos necesarios' });

    const message = new Message();
    message.emitter = req.user.sub;
    message.receiver = params.receiver;
    message.text = params.text;
    message.created_at = moment().unix();
    message.viewed = false;

    message.save((err, messageStored) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });
        if (!messageStored) return res.status(500).send({ message: 'Error en la petición' });

        return res.status(200).send({ message: messageStored });
    });
}

function getReceiverMessages(req, res) {
    const userId = req.user.sub;

    let page = 1;
    const itemsPerPage = 4;

    if (req.params.page) page = req.params.page;

    Message.find({ receiver: userId }).populate('emitter', 'name surname image nick _id').paginate(page, itemsPerPage, (err, messages, total) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });
        if (!messages) return res.status(500).send({ message: 'No hay mensajes' });

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total / itemsPerPage),
            messages
        });
    });
}

function getEmmitMessages(req, res) {
    const userId = req.user.sub;

    let page = 1;
    const itemsPerPage = 4;

    if (req.params.page) page = req.params.page;
    console.log(userId);

    Message.find({ emitter: userId }).populate('emitter receiver', 'name surname image nick _id').paginate(page, itemsPerPage, (err, messages, total) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });
        if (!messages) return res.status(500).send({ message: 'No hay mensajes' });

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total / itemsPerPage),
            messages
        });
    });
}

function getUnviewedMessages(req, res) {
    const userId = req.user.sub;

    Message.count({ receiver: userId, viewed: 'false' }).exec((err, count) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });

        return res.status(200).send({
            'unviewed': count
        });
    });
}

function setViewedMessages(req, res) {
    const userId = req.user.sub;

    Message.update({ receiver: userId, viewed: false }, { viewed: true }, { "multi": true }, (err, messageUpdated) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });
        // if (!messageUpdated) return res.status(404).send({message: 'No se ha podido actualizar el mensaje'});

        return res.status(200).send({ messages: messageUpdated });
    });
}

module.exports = {
    saveMessage,
    getReceiverMessages,
    getEmmitMessages,
    getUnviewedMessages,
    setViewedMessages
}

