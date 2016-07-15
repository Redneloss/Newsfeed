var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
    login        : {
        type: String,
        reqired: true
    },
    password     : {
        type: String,
        reqired: true
    },
    avatar: {
        type: String,
        default: "uploads/q.png"
    },
    hiddenBy: {
        type: Number,
        default: 0
    },
    totalLikes: {
        type: Number,
        default: 0
    },
    notShowed: {
        type: [mongoose.Schema.Types.ObjectId],
        default: []
    }
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
