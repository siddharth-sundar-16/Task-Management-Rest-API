const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const task = require('./task')
require('dotenv').config();

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(email) {
            if(!validator.isEmail(email)) {
                throw new Error('Please enter a proper email!')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate(password) {
            if(password.length < 6) {
                throw new Error('Password is too short!')
            } else if (password.toLowerCase().match('password')) {
                throw new Error('Enter another password!')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0) {
                throw new Error('Please enter proper age!')  
            }

        }
    },
    tokens : [{
        token : {
            type: String,
            required: true,
        }
    }], 
    avatar : {
        type: Buffer

    }
}, {
    timestamps: true

})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function () {
    const users = this
    const usersObject = users.toObject()

    delete usersObject.password
    delete usersObject.tokens
    delete usersObject.avatar

    return usersObject

}

userSchema.methods.generateAuthTokens = async function() {

    const users = this
    const token = jwt.sign({_id : users._id.toString() }, process.env.JWT_SECRET)
    users.tokens = users.tokens.concat({ token })

    await users.save()

    return token

}

userSchema.statics.findByCredentials = async (email, password) => {

    const users = await user.findOne({ email })

    if(!users) {
        throw new Error('Unable to login ! Please try again !')
    }

    const isMatch = await bcrypt.compare(password, users.password)
    if(!isMatch) {
        throw new Error('Unable to login ! Please try again !')
    }

    return users

}

//hashing a given user password

userSchema.pre('save', async function(next) {
    const users = this

    if(users.isModified('password')) {
        users.password = await bcrypt.hash(users.password, 9)

    }
    next()
})

userSchema.pre('remove', async function(next) {
    const users = this

    await task.deleteMany({owner : users._id})

})


const user = mongoose.model('User', userSchema)

module.exports = user