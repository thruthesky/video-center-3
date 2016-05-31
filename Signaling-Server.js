// Muaz Khan      - www.MuazKhan.com
// MIT License    - www.WebRTC-Experiment.com/licence
// Documentation  - github.com/muaz-khan/RTCMultiConnection

module.exports = exports = function(app, socketCallback) {
    var listOfUsers = {};
    var shiftedModerationControls = {};
    var ScalableBroadcast;

    var chat = []; // 인덱싱을 socket.id 로 한다.


    // whiteboard
    var whiteboard_line_history = [];

    var io = require('socket.io');

    try {
        io = io(app);
        io.on('connection', onConnection);
    } catch (e) {
        io = io.listen(app, {
            log: false,
            origins: '*:*'
        });

        io.set('transports', [
            'websocket', // 'disconnect' EVENT will work only with 'websocket'
            'xhr-polling',
            'jsonp-polling'
        ]);

        io.sockets.on('connection', onConnection);
    }

    function onConnection(socket) {
        var params = socket.handshake.query;
        var socketMessageEvent = params.msgEvent || 'RTCMultiConnection-Message';

        if (params.enableScalableBroadcast) {
            if (!ScalableBroadcast) {
                ScalableBroadcast = require('./Scalable-Broadcast.js');
            }
            ScalableBroadcast(socket, params.maxRelayLimitPerUser);
        }

        // temporarily disabled
        if (false && !!listOfUsers[params.userid]) {
            params.dontUpdateUserId = true;
            var useridAlreadyTaken = params.userid;
            params.userid = (Math.random() * 1000).toString().replace('.', '');
            socket.emit('userid-already-taken', useridAlreadyTaken, params.userid);
        }

        socket.userid = params.userid;
        listOfUsers[socket.userid] = {
            socket: socket,
            connectedWith: {},
            isPublic: false, // means: isPublicModerator
            extra: {}
        };

        socket.on('extra-data-updated', function(extra) {
            try {
                if (!listOfUsers[socket.userid]) return;
                listOfUsers[socket.userid].extra = extra;

                for (var user in listOfUsers[socket.userid].connectedWith) {
                    listOfUsers[user].socket.emit('extra-data-updated', socket.userid, extra);
                }
            } catch (e) {}
        });

        socket.on('become-a-public-moderator', function() {
            try {
                if (!listOfUsers[socket.userid]) return;
                listOfUsers[socket.userid].isPublic = true;
            } catch (e) {}
        });

        socket.on('dont-make-me-moderator', function() {
            try {
                if (!listOfUsers[socket.userid]) return;
                listOfUsers[socket.userid].isPublic = false;
            } catch (e) {}
        });

        socket.on('get-public-moderators', function(userIdStartsWith, callback) {
            try {
                userIdStartsWith = userIdStartsWith || '';
                var allPublicModerators = [];
                for (var moderatorId in listOfUsers) {
                    if (listOfUsers[moderatorId].isPublic && moderatorId.indexOf(userIdStartsWith) === 0 && moderatorId !== socket.userid) {
                        var moderator = listOfUsers[moderatorId];
                        allPublicModerators.push({
                            userid: moderatorId,
                            extra: moderator.extra
                        });
                    }
                }

                callback(allPublicModerators);
            } catch (e) {}
        });

        socket.on('changed-uuid', function(newUserId, callback) {

            if (params.dontUpdateUserId) {
                delete params.dontUpdateUserId;
                return;
            }


            try {
                if (listOfUsers[socket.userid] && listOfUsers[socket.userid].socket.id == socket.userid) {
                    if (newUserId === socket.userid) return;

                    var oldUserId = socket.userid;
                    listOfUsers[newUserId] = listOfUsers[oldUserId];
                    listOfUsers[newUserId].socket.userid = socket.userid = newUserId;
                    //console.log(newUserId);
                    //console.log(listOfUsers[newUserId]);

                    delete listOfUsers[oldUserId];

                    callback();
                    return;
                }

                var oldSocketId = socket.userid;
                socket.userid = newUserId;
                listOfUsers[socket.userid] = {
                    socket: socket,
                    connectedWith: {},
                    isPublic: true,
                    extra: listOfUsers[oldSocketId].extra
                };

                callback();
            } catch (e) {}
        });

        socket.on('set-password', function(password) {
            try {
                if (listOfUsers[socket.userid]) {
                    listOfUsers[socket.userid].password = password;
                }
            } catch (e) {}
        });

        socket.on('disconnect-with', function(remoteUserId, callback) {
            try {
                if (listOfUsers[socket.userid] && listOfUsers[socket.userid].connectedWith[remoteUserId]) {
                    delete listOfUsers[socket.userid].connectedWith[remoteUserId];
                    socket.emit('user-disconnected', remoteUserId);
                }

                if (!listOfUsers[remoteUserId]) return callback();

                if (listOfUsers[remoteUserId].connectedWith[socket.userid]) {
                    delete listOfUsers[remoteUserId].connectedWith[socket.userid];
                    listOfUsers[remoteUserId].socket.emit('user-disconnected', socket.userid);
                }
                callback();
            } catch (e) {}
        });

        socket.on('close-entire-session', function(callback) {
            try {
                var connectedWith = listOfUsers[socket.userid].connectedWith;
                Object.keys(connectedWith).forEach(function(key) {
                    if (connectedWith[key] && connectedWith[key].emit) {
                        try {
                            connectedWith[key].emit('closed-entire-session', socket.userid, listOfUsers[socket.userid].extra);
                        } catch (e) {}
                    }
                });
                
                delete shiftedModerationControls[socket.userid];
                callback();
            } catch (e) {
                throw e;
            }
        });

        socket.on('check-presence', function(userid, callback) {
            try {
            if (userid === socket.userid && !!listOfUsers[userid]) {
                callback(false, socket.userid, listOfUsers[userid].extra);
                return;
            }

            var extra = {};
            if (listOfUsers[userid]) {
                extra = listOfUsers[userid].extra;
            }

                callback(!!listOfUsers[userid], userid, extra);
            }
            catch (e) {}
        });

        function onMessageCallback(message) {
            try {
                if (!listOfUsers[message.sender]) {
                    socket.emit('user-not-found', message.sender);
                    return;
                }

                if (!message.message.userLeft && !listOfUsers[message.sender].connectedWith[message.remoteUserId] && !!listOfUsers[message.remoteUserId]) {
                    listOfUsers[message.sender].connectedWith[message.remoteUserId] = listOfUsers[message.remoteUserId].socket;
                    listOfUsers[message.sender].socket.emit('user-connected', message.remoteUserId);

                    if (!listOfUsers[message.remoteUserId]) {
                        listOfUsers[message.remoteUserId] = {
                            socket: null,
                            connectedWith: {},
                            isPublic: false,
                            extra: {}
                        };
                    }

                    listOfUsers[message.remoteUserId].connectedWith[message.sender] = socket;

                    if (listOfUsers[message.remoteUserId].socket) {
                        listOfUsers[message.remoteUserId].socket.emit('user-connected', message.sender);
                    }
                }

                if (listOfUsers[message.sender].connectedWith[message.remoteUserId] && listOfUsers[socket.userid]) {
                    message.extra = listOfUsers[socket.userid].extra;
                    listOfUsers[message.sender].connectedWith[message.remoteUserId].emit(socketMessageEvent, message);
                }
            } catch (e) {}
        }

        var numberOfPasswordTries = 0;
        socket.on(socketMessageEvent, function(message, callback) {
            if (message.remoteUserId && message.remoteUserId === socket.userid) {
                // remoteUserId MUST be unique
                return;
            }

            try {
                if (message.remoteUserId && message.remoteUserId != 'system' && message.message.newParticipationRequest) {
                    if (listOfUsers[message.remoteUserId] && listOfUsers[message.remoteUserId].password) {
                        if (numberOfPasswordTries > 3) {
                            socket.emit('password-max-tries-over', message.remoteUserId);
                            return;
                        }

                        if (!message.password) {
                            numberOfPasswordTries++;
                            socket.emit('join-with-password', message.remoteUserId);
                            return;
                        }

                        if (message.password != listOfUsers[message.remoteUserId].password) {
                            numberOfPasswordTries++;
                            socket.emit('invalid-password', message.remoteUserId, message.password);
                            return;
                        }
                    }
                }

                if (message.message.shiftedModerationControl) {
                    if (!message.message.firedOnLeave) {
                        onMessageCallback(message);
                        return;
                    }
                    shiftedModerationControls[message.sender] = message;
                    return;
                }

                // for v3 backward compatibility; >v3.3.3 no more uses below block
                if (message.remoteUserId == 'system') {
                    if (message.message.detectPresence) {
                        if (message.message.userid === socket.userid) {
                            callback(false, socket.userid);
                            return;
                        }

                        callback(!!listOfUsers[message.message.userid], message.message.userid);
                        return;
                    }
                }

                if (!listOfUsers[message.sender]) {
                    listOfUsers[message.sender] = {
                        socket: socket,
                        connectedWith: {},
                        isPublic: false,
                        extra: {}
                    };
                }

                // if someone tries to join a person who is absent
                if (message.message.newParticipationRequest) {
                    var waitFor = 120; // 2 minutes
                    var invokedTimes = 0;
                    (function repeater() {
                        invokedTimes++;
                        if (invokedTimes > waitFor) {
                            socket.emit('user-not-found', message.remoteUserId);
                            return;
                        }

                        if (listOfUsers[message.remoteUserId] && listOfUsers[message.remoteUserId].socket) {
                            onMessageCallback(message);
                            return;
                        }

                        setTimeout(repeater, 1000);
                    })();

                    return;
                }

                onMessageCallback(message);
            } catch (e) {}
        });

        socket.on('disconnect', function() {
            try {
                delete socket.namespace.sockets[this.id];
            } catch (e) {}

            try {
                var message = shiftedModerationControls[socket.userid];

                if (message) {
                    delete shiftedModerationControls[message.userid];
                    onMessageCallback(message);
                }
            } catch (e) {}

            try {
                // inform all connected users
                if (listOfUsers[socket.userid]) {
                    for (var s in listOfUsers[socket.userid].connectedWith) {
                        listOfUsers[socket.userid].connectedWith[s].emit('user-disconnected', socket.userid);

                        if (listOfUsers[s] && listOfUsers[s].connectedWith[socket.userid]) {
                            delete listOfUsers[s].connectedWith[socket.userid];
                            listOfUsers[s].socket.emit('user-disconnected', socket.userid);
                        }
                    }
                }
            } catch (e) {}

            delete listOfUsers[socket.userid];
        });

        socket.on('listOfUsers', function(callback) {
            //socket.emit( 'listOfUsers', listOfUsers );
            //console.log( listOfUsers );
            // callback( listOfUsers );
            var msg = '';
            //console.log("User IDs: ");
            for ( var i in listOfUsers ) {

                var conn = '';
                for ( var c in listOfUsers[i].connectedWith ) {
                    conn += c + ', ';
                }
                s = i + ' => ' + conn;
                msg += s + ' : ';
                //console.log( s );
            }
            callback( msg );
        });

        if (socketCallback) {
            socketCallback(socket);
        }

        // ------------------------------------------------------------------
        //
        //
        // S O C K E T    C H A T    R O O M    C O D E
        //
        //
        // ------------------------------------------------------------------


        chat[ socket.id ] = socket;


        var info = {};
        info.username = 'Anonymous';
        info.connectedOn = Math.floor( new Date() / 1000 );
        info.socket_id = socket.id;
        socket.info = info;


        cleanWhiteboardHistory();



        //console.log(chat);

        console.log('New connection on chat. No. of clients : ' + getNumberChatClients());

        socket.on('disconnect', function(){

            var info = socket.info;

            //console.log( info.username + ' disconnects on '+info.roomname+' ------------------------- ');
            //console.log( info );

            // emit to all the room members that this user disconnected.
            if ( info.roomname ) {
                io.sockets.in( info.roomname ).emit( 'room-leave', info );
            }

            if ( typeof chat[socket.id] == 'undefined' ) {
                console.log("ERROR : chat[" + socket.id + "] does not exist on chat array.");
            }
            removeChatClient( socket.id );
            //chat.splice( chat.indexOf( socket ), 1 );

            cleanWhiteboardHistory();
            console.log("chat client count: " + getNumberChatClients() + "client names: " + getClientNames() );
        });

        socket.on('chat-set-user-info', function ( info, callback ) {
            socket.info.username = info.username;
            socket.info.usernameUpdatedOn = Math.floor( new Date() / 1000 );
            socket.info.session_id = info.session_id;
            socket.info.session_user_id = info.session_user_id;
            callback( socket.info );
        });

        socket.on('chat-get-user-info', function( userid, callback ) {
            console.log('userid : ' + userid);
            var s = getSocketByUserID( userid );
            try {

                console.log(s);
                callback( s.info );
            }
            catch ( e ) {}
        });


        // -------------------------------------------------------------------
        //
        socket.on('chat-user-list', function( callback ) {
            var userList = [];
            for ( var socket_id in chat ) {
                userList.push( chat[ socket_id ].info );
            }
            callback( userList );
        });

        // -------------------------- R O O M ---------------------------------
        //
        socket.on('chat-room-list', function(callback) {
            var roomList = getRoomListOf();
            callback( roomList );
        });

        socket.on('chat-room-info', function( roomname, callback ) {
            callback( getRoomListOf( roomname ) );
        });
        socket.on('chat-roomname-list', function( callback ) {
            callback( getRoomNameList() );
        });

        socket.on('chat-join-room', function( roomname, callback ) {
            // console.log(socket);
            socket.info.roomname = roomname;
            socket.info.roomJoinedOn = Math.floor( new Date() / 1000 );
            var username = socket.info.username;
            // console.log( username + " joins " + roomname);
            socket.join( roomname );
            callback( roomname, socket.info );
            io.sockets.in( roomname ).emit( 'user-join', socket.info );
        } );

        socket.on('chat-room-leave', function(roomname, callback) {
            socket.leave( roomname );
            callback( roomname, socket.ino );
        });

        socket.on('chat-send-message', function( data, callback ) {
            // Version diff.
            // 0.9.x must use 'io.sockets.in' instead of 'io.to'
            io.sockets.in( data.room ).emit('chat-recv-message', data );
            callback(data);
        });


        /**
         * White Board
         */
        socket.on('whiteborad-draw-line', function( data ) {
            // add received line to history
            if ( typeof whiteboard_line_history[data.roomname] == 'undefined' ) whiteboard_line_history[data.roomname] = [];
            whiteboard_line_history[data.roomname].push(data);
            // send line to all clients
            io.sockets.in( data.roomname ).emit('whiteborad-draw-line', data);
        });
        /**
         * 그림 기록 정보를 자기 자신만 받는다.
         */
        socket.on('get-whiteboard-draw-line-history', function( roomname ) {
            // first send the history to the new client
            if ( typeof whiteboard_line_history[roomname] != 'undefined' ) {
                var lines = whiteboard_line_history[roomname];
                for (var i in lines ) {
                    var data = lines[i];
                    socket.emit('whiteborad-draw-line-history', data );
                }
            }
        });

        /**
         *
         */
        socket.on('whiteboard-clear', function( roomname ) {
            io.sockets.in( roomname ).emit('whiteboard-clear', roomname);
            if ( typeof whiteboard_line_history[roomname] != 'undefined' ) {
                whiteboard_line_history[roomname] = [];
                delete whiteboard_line_history[roomname];
            }
        });

        /**
         * 방의 참가자들에게 메세지를 broadcasting 하는 만능 이벤트 핸들러를 만든다.
         */
        socket.on('room-cast', function ( data ) {
            io.sockets.in( data.roomname ).emit('room-cast', data);
            if ( typeof data.callback != 'undefined' ) {
                var re = data;
                re.callback = '';
                delete re.callback;
                data.callback( re );
            }
        });


    } // eo onConnection(socket)

    function getNumberChatClients() {
        return Object.keys(chat).length;
    }

    function removeChatClient( id ) {
        var s = chat[ id ]; // socket
        delete chat[ id ];
    }


    function getClientNames() {
        var names = '';
        for( var id in chat ) {
            var socket = chat[id];
            names += socket.info.username + ', ';
        }
        return names;
    }


    /**
     * Returns room list only without user information
     * @returns {Array}
     */
    function getRoomNameList() {
        // var rooms = io.sockets.adapter.rooms; // for version 1.x.x
        var rooms = io.sockets.manager.rooms;
        var roomList = [];
        for( var id in rooms ) {
            if ( id.indexOf('/#') != -1 ) continue; // for socket.io 1.x.x
            if ( id == '' ) continue;
            id = id.replace( /^\//, '' );
            roomList.push( id );
        }
        return roomList;
    }

    /**
     * Returns room list with its users information.
     *
     * @param roomname - room name. if it is 'undefined', it returns all room information.
     * @returns {{}}
     */
    function getRoomListOf( roomname ) {

        //var rooms = io.sockets.adapter.rooms;
        var rooms = io.sockets.manager.rooms;
        var roomList = {};

        //console.log(rooms);

        /**
         * @Attention in Socket.IO version 1.x.x it has leading '/#' on ever room. Check what if room name that begins with '/#'
         *
         */
        for( var id in rooms ) {
            if ( id.indexOf('/#') != -1 ) continue; // for socket.io 1.x.x
            if ( id == '' ) continue;
            var org_id = id.replace( /^\//, '' );

            if ( roomname && roomname != org_id ) continue;

            var socketIDs = rooms[id];
            //console.log(socketIDs);
            var users = [];
            for ( var i in socketIDs ) {
                var s = socketIDs[i];
                users.push(chat[s].info);
            }
            if ( roomname ) return users;
            roomList[org_id] = users;
        }

        //console.log(roomList);

        return roomList;
    }

    /**
     * 더 이상 사용하지 않는 방의 Whiteboard 의 그림 기록을 버퍼에서 비운다.
     * 누군가 새로운 접속을 하거나 끊을 때, 그 방에 아무도 없다면 ( 즉, 방이 존재하지 않는 다면 )
     * whiteboard_line_history 에서 해당 방의 그림 기록을 지운다.
     *
     * @note 이 함수는 아무데서나 호출 될 수 있다.
     */
    function cleanWhiteboardHistory() {
        console.log(getRoomNameList());
        console.log(whiteboard_line_history);
        var rooms = getRoomNameList();
        for ( var i in whiteboard_line_history ) {
            if ( rooms.indexOf(i) == -1 ) {
                delete whiteboard_line_history[i];
            }
        }
    }

};
