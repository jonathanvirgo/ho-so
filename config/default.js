var nodemailer = require('nodemailer');
module.exports = {
    mail_header: nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'hotrodinhduongtoiuu@gmail.com',
            pass: 'msbsednwwvykxnkm'
        }
    }),
}