'use strict'

const bcrypt = require('bcrypt-nodejs');
const User = require('../models/user');
const Follow = require('../models/follow');
const Publication = require('../models/publication');

const Jwt = require('../services/jwt');
const MongoosePaginate = require('../libraries/mongoose-pagination');
const fs = require('fs'); // Librería File System de Node Js
const path = require('path');

function pruebas(req, res) {
    const params = req.body;

    return res.status(200).send({
        message: 'Todo ok! :)'
    });
}

// Registro de usuarios
function saveUser(req, res) {
    let params = req.body;
    let user = new User();

    if (params.name && params.surname
        && params.nick && params.email && params.password) {

        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;

        // Controlar usuarios duplicados
        User.find({
            $or: [
                { email: user.email.toLowerCase() },
                { nick: user.nick.toLowerCase() }
            ]
        }).exec((err, users) => {
            if (err) return res.status(404).send({ message: 'Error en la petición de usuarios' });
            if (users && users.length >= 1) return res.status(200).send({ message: 'El usuario que intenta registrar ya existe' });
        });

        // Cifrar la contraseña y registrar usuario
        bcrypt.hash(params.password, null, null, (err, hash) => {
            user.password = hash;
            user.save((err, userStored) => {
                if (err) return res.status(404).send({ message: 'Error al guardar el usuario' });

                if (userStored) {
                    return res.status(200).send({ user: userStored });
                } else {
                    return res.status(404).send({ message: 'No se ha registrado el usuario' });
                }
            })
        });

    } else {
        return res.status(200).send({
            message: 'Envia todos los campos necesarios'
        });
    }
}

// Login de usuario
function loginUser(req, res) {
    const params = req.body;
    const email = params.email;
    const password = params.password;

    User.findOne({ email: email }, (err, user) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });

        if (user) {
            bcrypt.compare(password, user.password, (err, check) => {
                if (check) {
                    if (params.gettoken) {
                        // Generar y devolver token
                        return res.status(200).send({ token: Jwt.createToken(user) });
                    } else {
                        user.password = undefined;
                        return res.status(200).send({ user });
                    }
                } else {
                    return res.status(404).send({ message: 'El usuario no se ha podido identificar' });
                }
            });
        } else {
            return res.status(404).send({ message: 'El usuario no se ha podido identificar' });
        }
    })
        .exec((err, users) => {
            if (err) return res.status(404).send({ message: 'Error en la petición de usuarios' });
            if (users && users.length >= 1) return res.status(200).send({ message: 'El usuario que intenta registrar ya existe' });
        });
}

// Conseguir los datos de un usuario
// function getUser(req, res) {
//     const userId = req.params.id;

//     User.findById(userId, (err, user) => {
//         if (err) return res.status(500).send({ message: 'Error en la petición' });

//         if (!user) return res.status(404).send({ message: 'El usuario no existe' });

//         // Llamo al método asyncrono para obtener los datos requeridos
//         followThisUser(req.user.sub, userId).then((value) => {
//             return res.status(200).send({
//                 user,
//                 'following': value.following,
//                 'followed': value.followed
//             });
//         });

//     });
// }

// async function followThisUser(identity_user_id, user_id) {
//     let following = await Follow.findOne({ 'user': identity_user_id, 'followed': user_id }).exec((err, follow) => {
//         if (err) return handleError(err); // Muestra el error por consola
//         return follow;
//     });

//     let followed = await Follow.findOne({ 'user': user_id, 'followed': identity_user_id }).exec((err, follow) => {
//         if (err) return handleError(err); // Muestra el error por consola
//         return follow;
//     });

//     return {
//         following: following,
//         followed: followed
//     }
// }

function getUser(req, res) {
    var userId = req.params.id;
    User.findById(userId, (err, user) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });
        if (!user) return res.status(404).send({ message: 'El usuario no existe' });
        followThisUser(req.user.sub, userId).then((value) => {
            user.password = undefined;
            return res.status(200).send({
                user,
                following: value.following,
                followed: value.followed
            });
        });
    });
}

async function followThisUser(identity_user_id, user_id) {
    try {
        var following = await Follow.findOne({ user: identity_user_id, followed: user_id }).exec()
            .then((following) => {
                return following;
            })
            .catch((err) => {
                return handleError(err);
            });
        var followed = await Follow.findOne({ user: user_id, followed: identity_user_id }).exec()
            .then((followed) => {
                return followed;
            })
            .catch((err) => {
                return handleError(err);
            });
        return {
            following: following,
            followed: followed
        }
    } catch (e) {
        console.log(e);
    }
}

// Obtener todos los usuarios
function getUsers(req, res) {
    let identity_user_id = req.user.sub;

    let page = 1;
    if (req.params.page) page = req.params.page;

    const itemsPerPage = 3;

    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });

        if (!users) return res.status(404).send({ message: 'No hay usuarios disponibles' });

        followUserIds(identity_user_id).then((value) => {
            return res.status(200).send({
                users,
                users_following: value.following,
                users_follow_me: value.followed,
                total,
                pages: Math.ceil(total / itemsPerPage)
            });

        })
    });
}

async function followUserIds(user_id) {
    const following = await Follow.find({ 'user': user_id }).select({ '_id': 0, '__v': 0, 'user': 0 }).exec((err, follows) => {
        return follows;
    });

    const followed = await Follow.find({ 'followed': user_id }).select({ '_id': 0, '__v': 0, 'followed': 0 }).exec((err, follows) => {
        return follows;
    });

    // Procesar followings ids
    let following_clean = [];
    following.forEach(follow => {
        following_clean.push(follow.followed);
    });

    // Procesar followed ids
    let followed_clean = [];
    followed.forEach(follow => {
        followed_clean.push(follow.user);
    });

    return {
        following: following_clean,
        followed: followed_clean
    }
}

// Edición de datos del usuario
function updateUser(req, res) {
    const userId = req.params.id;
    const update = req.body;

    delete update.password;

    if (userId != req.user.sub) {
        return res.status(500).send({ message: 'No tienes permiso para actualizar los datos del usuario' });
    }

    User.find({
        $or: [
            { email: update.email.toLowerCase() },
            { nick: update.nick.toLowerCase() }
        ]
    }).exec((err, users) => {
        let user_isset = false;
        users.forEach((user) => {
            if (user && user._id != userId) user_isset = true;
        });

        if (user_isset) return res.status(404).send({ message: 'Los datos ingresados ya están en uso' });

        User.findByIdAndUpdate(userId, update, { new: true }, (err, user) => {
            if (err) return res.status(500).send({ message: 'Error en la petición' });

            if (!user) return res.status(404).send({ message: 'No se ha podido actualizar el usuario' });

            return res.status(200).send({ user: user });
        });
    });
}

// Subir archivos de imagen/avatar de usuario
function uploadImage(req, res) {
    const userId = req.params.id;

    try {
        const file_path = req.files.image.path;

        const file_split = file_path.split('\\');
        const file_name = file_split[2];
        const ext_split = file_name.split('\.');
        const file_ext = ext_split[1];


        if (userId != req.user.sub) {
            return removeFilesOfUploads(res, file_path, 'No tienes permiso para actualizar los datos del usuario');
        }

        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {
            // Actualizar documento de usuario logueado
            User.findByIdAndUpdate(userId, { image: file_name }, { new: true }, (err, userUpdated) => {
                if (err) return res.status(500).send({ message: 'Error en la petición' });
                if (!userUpdated) return res.status(404).send({ message: 'No se ha podido actualizar los datos del usuario' });
                return res.status(200).send({ user: userUpdated });
            });
        } else {
            // En caso de que la extensión sea incorrecta
            return removeFilesOfUploads(res, file_path, 'La extensión no es Valida');
        }

    } catch {
        return res.status(200).send({ message: 'No se han subido imagenes' });
    }

}

function removeFilesOfUploads(res, file_path, message) {
    fs.unlink(file_path, (err) => {
        return res.status(200).send({ message: message });
    });
}

function getImageFile(req, res) {
    const image_file = req.params.imageFile;
    const path_file = './uploads/users/' + image_file;

    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            return res.status(200).send({ message: 'No existe la imagen..' });
        }
    });
}

function getCounters(req, res) {
    const user_id = (req.params.id) ? req.params.id : req.user.sub;

    getCountFollow(user_id).then((value) => {
        return res.status(200).send(value);
    });
}

async function getCountFollow(user_id) {
    const following = await Follow.count({ "user": user_id }).exec((err, count) => {
        if (err) return handleError(err);
        return count;
    });

    const followed = await Follow.count({ "followed": user_id }).exec((err, count) => {
        if (err) return handleError(err);
        return count;
    });

    const publications = await Publication.count({ 'user': user_id }).exec((err, count) => {
        if (err) return handleError(err);
        return count;
    })

    return {
        following: following,
        followed: followed,
        publications: publications
    }
}

module.exports = {
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    uploadImage,
    getImageFile
}
