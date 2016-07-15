var mongoose = require('mongoose');

var messageSchema = mongoose.Schema({
    text: String,
    author: {
        id: mongoose.Schema.Types.ObjectId,
        login: String,
        avatar: String
    },
    num: {
        type: Number,
        index: true
    },
    likes: {
        type: [mongoose.Schema.Types.ObjectId],
        default: []
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);