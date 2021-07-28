const jwt = require('jsonwebtoken')
const user = require('../models/user')
require('dotenv').config();

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decode = jwt.verify(token, process.env.JWT_SECRET)
        const users = await user.findOne({_id: decode._id, 'tokens.token' : token})
        if(!users) {
            throw new Error()
        }
        req.token = token
        req.users = users
        next()
    } catch (e) {
        res.status(401).send({ error: 'Please provide authentication!'})
    }
}

module.exports = auth