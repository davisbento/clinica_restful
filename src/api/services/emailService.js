var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');
var templateDir = path.join(__dirname, '..', 'templates', 'welcome');
var welcome = new EmailTemplate(templateDir);
var nodemailer = require('nodemailer');

var defaultTransport = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
        user: process.env.EMAIL_SERVICE_NAME,
        pass: process.env.EMAIL_SERVICE_PASS
    }
});

module.exports = {
    signupEmail: function (user, link, fn) {
        welcome.render({ user, link }, function (err, result) {
            if (err) {
                fn(false);
            }
            else {
                var transport = defaultTransport;
                transport.sendMail({
                    from: "petfinder@outlook.com",
                    to: user.email,
                    subject: "Bem vindo ao My Clinic",
                    html: result.html
                }, function (err, responseStatus) {
                    if (err) {
                        fn(false);
                    }
                    else {
                        fn(true);
                    }
                });
            }
        });
    },
    emailContato: function (email, message, fn) {
        var transport = defaultTransport;
        transport.sendMail({
            from: "petfinder@outlook.com",
            to: "davisilva4222@gmail.com",
            text: message,
            subject: "Contato ClinicaNaWeb"
        }, function (err, responseStatus) {
            if (err) {
                console.log(err)
                fn(false);
            }
            else {
                fn(true);
            }
        });
    }
}