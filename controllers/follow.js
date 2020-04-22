'use strict'

// const path = require('path');
// const fs = require('fs');
const MongoosePaginate = require('../libraries/mongoose-pagination');

const User = require('../models/user');
const Follow = require('../models/follow');

// Prueba
function prueba(req, res) {
    res.status(200).send({ message: 'Hola mundo desde follow controller' });
}

// Seguir a un usuario
function saveFollow(req, res) {
    const params = req.body;

    const follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err, followStored) => {
        if (err) return res.status(500).send({ message: 'Error al guardar el seguimiento' });

        if (!followStored) return res.status(404).send({ message: 'El seguimiento no se ha guardado' });

        return res.status(200).send({ follow: followStored });
    });
}

// Dejar de seguir a un usuario
function deteleFolow(req, res) {
    const userId = req.user.sub;
    const followId = req.params.id;

    Follow.find({ 'user': userId, 'followed': followId }).remove(err => {
        if (err) return res.status(500).send({ message: 'Error al dejar de seguir' });

        return res.status(200).send({ message: 'El follow se ha eliminado' });
    });
}

// Ver listado de usuarios seguidos
function getFollowingUsers(req, res) {
    let userId = req.user.sub;

    if (req.params.id && req.params.page) {
        userId = req.params.id;
    }

    let page = 1;

    if (req.params.page) {
        page = req.params.page;
    } else {
        page = req.params.id;
    }

    const itemsPerPage = 4;

    Follow.find({ user: userId }).populate({ path: 'followed' }).paginate(page, itemsPerPage, (err, follows, total) => {
        if (err) return res.status(500).send({ message: 'Error en el servidor' });

        if (!follows) return res.status(404).send({ message: 'No hay usuarios seguidos' });

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total / itemsPerPage),
            follows
        });
    });
}

// Listado de usuarios que me siguen o siguen a..
function getFollowedUsers(req, res) {
    let userId = req.user.sub;

    if (req.params.id && req.params.page) {
        userId = req.params.id;
    }

    let page = 1;

    if (req.params.page) {
        page = req.params.page;
    } else {
        page = req.params.id;
    }

    const itemsPerPage = 4;

    Follow.find({ followed: userId }).populate('user').paginate(page, itemsPerPage, (err, follows, total) => {
        if (err) return res.status(500).send({ message: 'Error en el servidor' });

        if (!follows) return res.status(404).send({ message: 'No te sigue ningun usuario' });

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total / itemsPerPage),
            follows
        });
    });
}

// Devolver listado de usuarios seguidos (sin paginar)
function getMyFollows(req, res) {
    let userId = req.user.sub;

    let find = Follow.find({ user: userId });

    if (req.params.followed) {
        find = Follow.find({ followed: userId });
    }

    find.populate('user followed').exec((err, follows) => {
        if (err) return res.status(500).send({ message: 'Error en el servidor' });

        if (!follows) return res.status(404).send({ message: 'No sigues a ningun usuario' });

        return res.status(200).send({ follows });
    });
}

module.exports = {
    prueba,
    saveFollow,
    deteleFolow,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows
}