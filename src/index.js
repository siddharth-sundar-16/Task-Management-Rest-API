const express = require('express')
const user = require('./models/user.js')
const task = require('./models/task')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

require('./db/mongoose.js')

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
    console.log('Server is listening at port', port)
})
