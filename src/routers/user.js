const express = require('express')
const user = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWEmail, sendCEmail } = require('../emails/account')

const router = new express.Router()

router.get('/users/me', auth, async (req, res) => {
    res.send(req.users)
})

router.post('/users', async (req, res) => {

    const createUser = new user(req.body)

    try {
        await createUser.save()
        sendWEmail(createUser.email, createUser.name)
        const token = await createUser.generateAuthTokens()
        res.status(201).send({createUser, token})
    } catch(e) {
        res.status(400).send(e)
    }
    
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))

        }
        cb(undefined, true)
    }
})

router.post('/users/me/avatar',auth, upload.single('avatar'), async (req, res) => {
    
    const buffer = await sharp(req.file.buffer).resize({width : 250, height : 250}).png().toBuffer()
    req.users.avatar = buffer
    await req.users.save()
    res.send()
}, (error, req, res, next) => {
     res.status(400).send({ error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.users.avatar = undefined
    await req.users.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const users = await user.findById(req.params.id)

        if(!users || !users.avatar) {
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(users.avatar)

    } catch (e) {
        res.status(404).send()
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const users = await user.findByCredentials(req.body.email, req.body.password)
        const token = await users.generateAuthTokens()
        res.send({users , token})
    }
    catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async(req, res) => {

    try {
        req.users.tokens = req.users.tokens.filter((token) => {
            return token.token !== req.token
        })

        await req.users.save()
        
        res.send()

    } catch (e) {
        res.status(500).send()
    }

})

router.post('/users/logoutAll', auth, async(req, res) => {
    try {
        req.users.tokens = []
        await req.users.save()
        res.send()
    } catch (e) {

        res.status(500).send(e)

    }
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'password', 'email', 'age']
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update)
    })
    if(!isValidOperation) {
        return res.status(400).send({ error : 'Invalid update carried out '})
    } else {
    try {
        const users = req.users

        updates.forEach((update) => {
            users[update] = req.body[update]
        })

        await users.save() 
        res.send(users)
    } catch (e) {
        res.status(400).send(e)
    }
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        sendCEmail(req.users.email, req.users.name)
        await req.users.remove()
        res.send(req.users)
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router