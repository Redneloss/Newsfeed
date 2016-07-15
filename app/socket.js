var mongoose = require('mongoose');
var async = require("async");
var User = require('./models/user');
var Message  = require('./models/message');

module.exports = function(http) {
    var io = require('socket.io')(http);

    io.on('connection', function(socket){
        console.log("A user connected");

        socket.on('chat message', function(msg){
            Message.findOne().sort({num: -1}).exec(function(err, lastMessage){
                var newMessage = new Message;
                newMessage.text = msg.text;
                newMessage.author = {
                    id: msg.author.id,
                    login: msg.author.login,
                    avatar: msg.author.avatar
                }
                if (!lastMessage){
                    newMessage.num = 1;
                } else {
                    newMessage.num = lastMessage.num + 1;
                }

                newMessage.save(function(err){
                    if (err) throw err;
                    User.find({notShowed: {$nin: [msg.author.id]}}, function(err, users){
                        //users are those who will receive the message
                        users.forEach(function(user){
                            io.emit('chat message', {newMessage: newMessage, userId: user._id});
                        })
                    });
                 });
            });
        });

        socket.on('initialization', function(data){
                initialize(data);
        });
        socket.on('more', function(data){
            socket.emit('clean');
            data.messageLimit += 5;
            Message.count(function(err, count){
                if (count <= 5)
                    data.messageLimit = 5;
                else if (data.messageLimit > count)
                    data.messageLimit = count;
                initialize(data);
            });
        });

        socket.on('fewer', function(data){
            socket.emit('clean');
            if(data.messageLimit >= 10)
                data.messageLimit -= 5;
            else
                data.messageLimit = 5;

            initialize(data);
        });

        function initialize(data){
            User.findOne({_id: data.userId}, function(err, user){
                var forbiddenAuthorsIds = user.notShowed;
                Message.find({"author.id": {$nin: forbiddenAuthorsIds}}).sort({num: -1}).limit(data.messageLimit)
                    .exec(function(err, lastMessages){
                    //lastMessages are just from permitted authors for a given users
                    if (data.messageLimit > lastMessages.length) data.messagesLimit = lastMessages.length;
                    socket.emit('initialization', {lastMessages: lastMessages, messageLimit: data.messageLimit, userId: data.userId});
                });
            })
        };

        socket.on('hideAnotherUser', function(data) {
            User.update({_id: data.currentUserId}, {$addToSet: {notShowed: data.anotherUserId}}).exec();
            User.update({_id: data.anotherUserId}, {$inc: {hiddenBy: 1}}).exec();
        });

        socket.on('addLike', function(data){
             Message.findOneAndUpdate({_id: data.messageId}, {$addToSet: {likes: data.userId}}).exec(function(err, likedMessage){
                 User.update({_id: likedMessage.author.id}, {$inc: {totalLikes: 1}}, function(err){
                     io.emit("likeAdded", data.messageId);
                 })
            })
        });

        socket.on('getLikesNames', function(messageId){
            var names = [];

            Message.findOne({_id: messageId}, function(err, msg){
                async.each(msg.likes, function(id, callback) {
                        User.findOne({_id: id}, function (err, user) {
                            names.push(user.login);
                            callback();
                        })
                    },  function(err){
                        socket.emit('getLikesNames', {names: names, messageId: msg._id});
                    }
                );
            })
        });

        socket.on('getRatings', function(){
            User.aggregate([
                {
                    $project: {
                        login: 1,
                        "rating": {
                            $cond:{
                                if: {$gt: ["$hiddenBy", 0]},
                                then: { $divide: ["$totalLikes", {$multiply: ["$hiddenBy", "$hiddenBy"]}] },
                                else: "$totalLikes"
                            }
                        }
                    }
                },
                {
                    $sort: {
                        rating: -1
                    }
                }
            ], function(err, users){
                if (err) throw err;
                socket.emit('getRatings', users);
            })
        });

        socket.on('getStats', function(userId){
            var o = {};
            var total = 0;
            Message.count({"author.id": userId}, function(err, c){
                total = c;

                o.map = function(){
                    var hour = this.date.getHours();

                    if (hour >= 0 && hour < 4){
                        emit("get0-4", 1)
                        emit("get4-8", 0)
                        emit("get8-16", 0)
                        emit("get16-24", 0)
                    }
                    if (hour >= 4 && hour < 8){
                        emit("get0-4", 0)
                        emit("get4-8", 1)
                        emit("get8-16", 0)
                        emit("get16-24", 0)
                    }
                    if (hour >= 8 && hour < 16){
                        emit("get0-4", 0)
                        emit("get4-8", 0)
                        emit("get8-16", 1)
                        emit("get16-24", 0)
                    }
                    if (hour >= 16 && hour < 24){
                        emit("get0-4", 0)
                        emit("get4-8", 0)
                        emit("get8-16", 0)
                        emit("get16-24", 1)
                    }
                }
                o.reduce = function(key, values){
                    return Array.sum(values);
                }
                o.query = {"author.id": userId};

                Message.mapReduce(o, function(err, results){
                    if (err) throw err;
                    socket.emit("getStats", {results: results, total: total});
                })
            });
        })

    });
}
