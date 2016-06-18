/**
 *
 *
 *
 *
 * @see README.md
 *
 *
 */
var vc = {};
exports = module.exports = vc;



vc.chat = []; // 인덱싱을 socket.id 로 한다.
vc.whiteboard_line_history = [];


vc.addSocket = function (socket) {

    var info = {};
    info.username = 'Anonymous';
    info.connectedOn = Math.floor( new Date() / 1000 );
    info.socket_id = socket.id;
    socket.info = info;

    vc.chat[ socket.id ] = socket;

};

/**
 *
 * Returns room list only without user information
 *
 * @returns {Array}
 */
vc.getRoomNameList = function () {

    // var rooms = io.sockets.adapter.rooms; // for version 1.x.x
    // console.log(vc.io);
    var rooms = vc.io.sockets.manager.rooms;
    var roomList = [];
    for( var id in rooms ) {
        if ( ! rooms.hasOwnProperty(id) ) continue;
        if ( id.indexOf('/#') != -1 ) continue; // for socket.io 1.x.x
        if ( id == '' ) continue;
        id = id.replace( /^\//, '' );
        roomList.push( id );
    }
    return roomList;
};
/**
 *
 * 전자칠판 청소. 방에 아무도 없으면, 전자칠판 그림 기록을 삭제한다.
 *
 * @설명
 * 더 이상 사용하지 않는 방의 Whiteboard 의 그림 기록을 버퍼에서 비운다.
 * 누군가 새로운 접속을 하거나 끊을 때, 그 방에 아무도 없다면 ( 즉, 방이 존재하지 않는 다면 )
 * whiteboard_line_history 에서 해당 방의 그림 기록을 지운다.
 *
 * @참고 만약 방에 혼자 있는데, 그림을 그리고 나서 그 방에 재 접속을 한다면 ( 방에 아무도 남지 않게 되므로 전자칠판 기록이 삭제되어),
 *      화면에 아무것도 나타나지 않는다.
 *
 * @note 이 함수는 아무데서나 호출 될 수 있다.
 */
vc.cleanWhiteboardHistory = function () {

    console.log(vc.getRoomNameList());
    console.log(vc.whiteboard_line_history);
    var rooms = vc.getRoomNameList();
    for ( var i in vc.whiteboard_line_history ) {
        if ( ! vc.whiteboard_line_history.hasOwnProperty(i) ) continue;
        if ( rooms.indexOf(i) == -1 ) {
            delete vc.whiteboard_line_history[i];
        }
    }
};
vc.getNumberChatClients = function () {
    return Object.keys(vc.chat).length;
};
vc.removeChatClient = function (id) {

    var s = vc.chat[ id ]; // socket
    delete vc.chat[ id ];
};



/**
 * Returns room list with its users information.
 *
 * @param roomname - room name. if it is 'undefined', it returns all room information.
 * @returns {{}}
 */
vc.getRoomListOf = function( roomname ) {

    //var rooms = io.sockets.adapter.rooms;
    var rooms = vc.io.sockets.manager.rooms;
    var roomList = {};

    //console.log(rooms);

    /**
     * @Attention in Socket.IO version 1.x.x it has leading '/#' on ever room. Check what if room name that begins with '/#'
     *
     */
    for( var id in rooms ) {
        if ( ! rooms.hasOwnProperty( id ) ) continue;
        if ( id.indexOf('/#') != -1 ) continue; // for socket.io 1.x.x
        if ( id == '' ) continue;
        var org_id = id.replace( /^\//, '' );

        if ( roomname && roomname != org_id ) continue;

        var socketIDs = rooms[id];
        //console.log(socketIDs);
        var users = [];
        for ( var i in socketIDs ) {
            if ( ! socketIDs.hasOwnProperty( i ) ) continue;
            var s = socketIDs[i];
            users.push(vc.chat[s].info);
        }
        if ( roomname ) return users;
        roomList[org_id] = users;
    }

    //console.log(roomList);

    return roomList;
};

vc.getClientNames = function() {
    var names = '';
    for( var id in vc.chat ) {
        if ( ! vc.chat.hasOwnProperty(id ) ) continue;
        var socket = vc.chat[id];
        names += socket.info.username + ', ';
    }
    return names;
};
vc.listen = function(socket) {

    //console.log( vc.io );

    vc.addSocket( socket );
    console.log('New connection on chat. No. of clients : ' + vc.getNumberChatClients());
    vc.cleanWhiteboardHistory();



    socket.on('disconnect', function(){

        var info = socket.info;

        //console.log( info.username + ' disconnects on '+info.roomname+' ------------------------- ');
        //console.log( info );

        // emit to all the room members that this user disconnected.
        if ( info.roomname ) {
            vc.io.sockets.in( info.roomname ).emit( 'room-leave', info );
        }

        if ( typeof vc.chat[socket.id] == 'undefined' ) {
            console.log("ERROR : chat[" + socket.id + "] does not exist on chat array.");
        }
        vc.removeChatClient( socket.id );
        //chat.splice( chat.indexOf( socket ), 1 );

        vc.cleanWhiteboardHistory();
        console.log("chat client count: " + vc.getNumberChatClients() + "client names: " + vc.getClientNames() );
    });


    socket.on('chat-room-list', function(callback) {
        var roomList = vc.getRoomListOf();
        callback( roomList );
    });

    socket.on('chat-room-info', function( roomname, callback ) {
        try {
            callback( vc.getRoomListOf( roomname ) );
        }
        catch (e) {}
    });
    socket.on('chat-roomname-list', function( callback ) {
        try {
            callback( vc.getRoomNameList() );
        }
        catch (e) {}
    });

    socket.on('chat-join-room', function( roomname, callback ) {
        // console.log(socket);
        socket.info.roomname = roomname;
        socket.info.roomJoinedOn = Math.floor( new Date() / 1000 );
        var username = socket.info.username;
        // console.log( username + " joins " + roomname);
        socket.join( roomname );
        callback( roomname, socket.info );
        vc.io.sockets.in( roomname ).emit( 'user-join', socket.info );

    } );

    socket.on('chat-room-leave', function(roomname, callback) {
        socket.leave( roomname );
        try {
            callback( roomname, socket.ino );
        }
        catch ( e ) {
            /** README.md */
            socket.emit('error', {'event': 'chat-room-leave', 'roomname': roomname } );
        }
    });

    socket.on('chat-send-message', function( data, callback ) {
        // Version diff.
        // 0.9.x must use 'io.sockets.in' instead of 'io.to'
        vc.io.sockets.in( data.room ).emit('chat-recv-message', data );
        callback(data);
    });


    /**
     * White Board
     */
    socket.on('whiteboard-draw-line', function( data ) {
        // add received line to history
        if ( typeof vc.whiteboard_line_history[data.roomname] == 'undefined' ) vc.whiteboard_line_history[data.roomname] = [];
        vc.whiteboard_line_history[data.roomname].push(data);
        // send line to all clients
        vc.io.sockets.in( data.roomname ).emit('whiteboard-draw-line', data);
    });
    /**
     * 그림 기록 정보를 자기 자신만 받는다.
     */
    socket.on('get-whiteboard-draw-line-history', function( roomname ) {
        // first send the history to the new client
        if ( typeof vc.whiteboard_line_history[roomname] != 'undefined' ) {
            var lines = vc.whiteboard_line_history[roomname];
            for (var i in lines ) {
                if ( ! lines.hasOwnProperty(i) ) continue;
                var data = lines[i];
                socket.emit('whiteboard-draw-line-history', data );
            }
        }
    });

    /**
     *
     */
    socket.on('whiteboard-clear', function( roomname ) {
        vc.io.sockets.in( roomname ).emit('whiteboard-clear', roomname);
        if ( typeof vc.whiteboard_line_history[roomname] != 'undefined' ) {
            vc.whiteboard_line_history[roomname] = [];
            delete vc.whiteboard_line_history[roomname];
        }
    });

    /**
     * 방의 참가자들에게 메세지를 broadcasting 하는 만능 이벤트 핸들러를 만든다.
     */
    socket.on('room-cast', function ( data ) {
        vc.io.sockets.in( data.roomname ).emit('room-cast', data);
        if ( typeof data.callback != 'undefined' ) {
            var re = data;
            re.callback = '';
            delete re.callback;
            data.callback( re );
        }
    });

    /**
     * @deprecated
     */
    socket.on('chat-set-user-info', function ( info, callback ) {
        socket.info.username = info.username;
        socket.info.usernameUpdatedOn = Math.floor( new Date() / 1000 );
        socket.info.session_id = info.session_id;
        socket.info.session_user_id = info.session_user_id;
        callback( socket.info );
    });


    /**
     * Updates user info
     */
    socket.on('chat-set-userinfo', function( info, callback) {
        socket.info.session_id = info.session_id;
        socket.info.session_user_id = info.session_user_id;
        callback( socket.info );
    });


    socket.on('chat-set-username', function ( username, callback ) {
        socket.info.username = username;
        socket.info.usernameUpdatedOn = Math.floor( new Date() / 1000 );
        if ( typeof callback == 'function' ) callback( username );
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
        for ( var socket_id in vc.chat ) {
            userList.push( vc.chat[ socket_id ].info );
        }
        callback( userList );
    });


    /*

     // @todo from here README.md 참고
     socket.on('admin-login', function( data, callback ) {
     data.event = 'admin-login';
     callback(data);
     });
     */

};