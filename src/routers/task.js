const express = require('express')
const task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.get('/tasks', auth, async (req, res) => {

    const match = {}
    const sort = {}
    if (req.query.completed === 'true' || req.query.completed === 'false') {
        match.completed = req.query.completed === 'true'
    } else if(req.query.completed && (req.query.completed !== 'true' || req.query.completed !== 'false' )) {
        return res.status(400).send('Invalid query supplied!')
    }

    if(req.query.sortBy && (req.query.sortBy === 'createdAt:desc' || req.query.sortBy === 'createdAt:asc')) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    } else {
        return res.status(406).send('Not acceptable query !')
    }
    try {
        await req.users.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.users.tasks)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth,  async (req, res) => {

    const _id = req.params.id

    try {
        const tasks = await task.findOne({_id, owner: req.users._id})

        if(!tasks) {
            return res.status(404).send()
        }
        res.send(tasks)
    } catch (e) {
        res.status(400).send(e)
    }
    
})

router.post('/tasks', auth, async (req, res) => {

    const createTask = new task({
        ...req.body,
        owner: req.users._id,

    })

    try {
        await createTask.save()
        res.status(201).send(createTask)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValid = updates.every((update) => {
        return allowedUpdates.includes(update)
    })
    if(!isValid) {
        return res.status(400).send({ error : 'Invalid update carried out!'})
    } 
    try {
        const tasks = await task.findOne({_id : req.params.id, owner: req.users._id})
        
        //const tasks = await task.findByIdAndUpdate(req.params.id, req.body, {new : true, runValidators : true})
        if(!tasks) {
            return res.status(404).send()
        }
        
        updates.forEach((update) => tasks[update] = req.body[update])

        await tasks.save()

        res.send(tasks)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id',auth,  async (req, res) => {
    try {
        const tasks = await task.findOneAndDelete({_id : req.params.id, owner: req.users._id})
        if(!tasks) {
            return res.status(404).send()
        }
        res.send(tasks)
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router