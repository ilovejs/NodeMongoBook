//inject dependencies
module.exports = function (config, mongoose, nodemailer) {
    var crypto = require('crypto');

    //TODO: good structure
    var AccountSchema = new mongoose.Schema({
        email: { type: String, unique: true },
        password: { type: String },
        name: {
            first: { type: String },
            last: { type: String }
        },
        birthday: {
            day: { type: Number, min: 1, max: 31, required: false },
            month: { type: Number, min: 1, max: 12, required: false },
            year: { type: Number }
        },
        photoUrl: { type: String },
        biography: { type: String }
    });

    var Account = mongoose.model('Account', AccountSchema);

    var registerCallback = function (err) {
        if (err) {
            return console.log(err);
        }
        return console.log('Account was created');
    };

    var changePassword = function (accountId, newpassword) {
        //create hash
        var shaSum = crypto.createHash('sha256');
        //Updates the hash content with the given data
        shaSum.update(newpassword);
        //Calculates the digest of all of the passed data to be hashed
        var hashedPassword = shaSum.digest('hex');
        //TODO: http://mongoosejs.com/docs/api.html#model_Model.update
        //query / object / options / callback
        Account.update({_id: accountId}, {$set: {password: hashedPassword}}, {upsert: false},
            function changePasswordCallback(err) {
                console.log('Change password done for account ' + accountId);
            });
    };

    var forgotPassword = function (email, resetPasswordUrl, callback) {
        var user = Account.findOne({email: email}, function findAccount(err, doc) {
            if (err) {
                // Email address is not a valid user
                callback(false);
            } else {
                var smtpTransport = nodemailer.createTransport('SMTP', config.mail);
                //append id
                resetPasswordUrl += '?account=' + doc._id;
                smtpTransport.sendMail({
                    from: 'thisapp@example.com',
                    to: doc.email,
                    subject: 'SocialNet Password Request',
                    text: 'Click here to reset your password: ' + resetPasswordUrl
                }, function forgotPasswordResult(err) {    //email services callback.
                    if (err) {
                        callback(false);
                    } else {
                        callback(true);
                    }
                });
            }
        });
    };

    var login = function (email, password, callback) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(password);
        //digest password
        Account.findOne({ email: email, password: shaSum.digest('hex')}, function (err, doc) {
            //TODO: found record , then return true.
            callback(null != doc);
        });
    };

    var register = function (email, password, firstName, lastName) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(password);

        console.log('Registering ' + email);

        var user = new Account({
            email: email,
            name: {
                first: firstName,
                last: lastName
            },
            password: shaSum.digest('hex')
        });
        //TODO: execute saving.
        user.save(registerCallback);
        console.log('Save command was sent');
    };

    return {
        register: register,
        forgotPassword: forgotPassword,
        changePassword: changePassword,
        login: login,
        Account: Account         //This POCO object is exposed.
    }
};
