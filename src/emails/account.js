require('dotenv').config()
const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'sundarsiddharth2000@gmail.com',
        subject: 'Welcome to the Task Management System!',
        text: `Thanks for registering ${name}, hope you have a wonderful time with our system!`,

    })
}

const sendCEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'sundarsiddharth2000@gmail.com',
        subject: 'Regarding Cancellation of Task Management Services',
        text: `Wish to intimate you that you have cancelled your subscription ${name}. Hope to have you again in the future!`
    })
}

module.exports = {
    sendWEmail,
    sendCEmail
}
