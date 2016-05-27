// ----------------------------------------------------------------------------
// S O C K E T   C O D E
// ----------------------------------------------------------------------------

var client = app = {};
//client.users = {};


socket.on('connect', function () {
    client.updateStatus();
});
socket.on( 'disconnect', function() {

} );
socket.on( 'reconnect', function() {

} );
socket.on ('chat-recv-message', function( data ) {
    console.info('socket.on("recv-message") : ', data);
    client.recvMessage( data );
});

socket.on ('chat-user-join', function( username ) {
    //console.log('new user joined : ' + username);
    client.userJoin( username );
});

client.userLeave = function (info) {
    client.addMessage( info.username + ' leaves');
};
socket.on ('chat-room-leave', function( info ) {
    // console.error( 'socket.on("room-leave")', info );
    client.userLeave( info );
});




// ----------------------------------------------------------------------------
// C H A T    C L I E N T   C O D E
// ----------------------------------------------------------------------------
client.box = function() { return $('#videocenter'); };
client.room = function () {
    return $('section#room');
};
client.chat = function () {
    return client.room().find('.chat');
};
client.messages = function () {
    return this.chat().find('.messages');
};
client.status = function() {
    return $('section#status');
};

client.roomList = function (callback) {
    socket.emit('chat-room-list', callback);
};

/**
 * Leave entire room
 * @param callback
 */
client.leaveRoom = function () {
    location.href = '?';
    //reload();
    /**
     connection.getAllParticipants().forEach(function(participantId) {
        connection.disconnectWith(participantId, function() {
            console.log( 'disconnectedWith: ' + participantId );
            callback();
        });
    });
     */
};



/**
 * @Attention It sets 'connection.userid', 'connection.sessionid' also.
 * @param username
 */
client.setUsername = function ( username ) {
    if ( ! username ) return;
    console.log('Going to set my name: client.setUsername : ', username);
    var info = {
        username : username,
        session_user_id: connection.userid,
        session_id : connection.sessionid
    };
    //console.log( info );
    socket.emit('chat-set-user-info', info, function( info ) {
        console.log('My name is set on chat server.  callback client.setUsername', info);
        Cookies.set('username', info.username, { expires: 365 });
        client.box().find('[name="username"]').val( info.username );
        //console.log('callback setUsername : -----------');
        //console.log(connection.userid);
        //console.log(info);
    });
};

client.userList = function( callback ) {
    socket.emit('chat-user-list', callback);
};

/**
 *
 * @param roomname
 * @param callback
 */
client.joinRoom = function (roomname, callback) {

    if ( client.joined() ) {
        if ( client.inLobbyRoom() ) {
            socket.emit('chat-room-leave', 'lobby', function( roomname, my_info ) {
                console.log('chat-room-leave : ' + roomname, my_info);
            });
        }
        else return alert('Leave current room before you join another room');
    }
    socket.emit('chat-join-room', roomname, function(data) {
        setTimeout(function() {
            connection.openOrJoin( roomname );
        }, 100);
        callback(data);
    });
};

client.joinLobby = function( callback ) {
    socket.emit('chat-join-room', 'lobby', function(data) {
        callback( data );
    });
};


/**
 *
 * @param info
 */
client.userJoin = function (info) {
    console.log('user info: ', info);
    //client.users[ info.session_user_id ] = info;
    client.addMessage( info.username + ' has joined.');
    // connection.join( info.session_user_id );
};

client.sendMessage = function (data, callback) {
    //console.info('client.sendMessage : ', data);
    if ( ! client.joined() ) return alert('Join a room before you message');
    socket.emit('chat-send-message', data, callback);
    client.chat().find('input').val('');
};



client.recvMessage = function ( data ) {
    //console.log('recvMessage() : ', data);


    var message = '<div class="message">' + data.username + ' : ' + data.text + '</div>';
    client.addMessage( message );
};


client.addMessage = function( message ) {
    client.messages().append( '<div>' + message + '</div>' );
    //$room.find('.messages').append('<div class="message">'+ data.username + ':' + data.text+'</div>');
};
client.setRoomName = function( name ) {
    client.chat().find('.name').text( name );
    client.updateStatus();
};
client.getRoomName = function() {
    return client.chat().find('.name').text();
};

client.updateStatus = function() {
    var roomname = client.getRoomName();
    var str = '';
    if ( roomname ) {
        str += 'room: ' + roomname;
    }
    else {
        str += 'No room';
    }
    client.status().text( str );
};

client.getUsername = function () {
    var username = Cookies.get('username');
    if ( username ) return username;
    else this.box().find('.username input').val();
};

client.joined = function () {
    return !!client.getRoomName();
};


client.postJoinRoom = function ( roomname_joined ) {
    var username = client.getUsername();
    console.log( username + ' joined : ' + roomname_joined );

    client.setUsername( username );
    client.setRoomName( roomname_joined );
    connection.extra.socket_id = socket.id;
    connection.extra.username = username;
    connection.updateExtraData();
};

/**
 *
 * 페이지가 로딩 될 때, setTimeout() 으로 방 목록 정보를 무한 반복적으로 업데이트 한다.
 *
 * @param roomList
 */
client.onRoomListUpdate = function (roomList) {
    var m = '';
    for ( var i in roomList ) {
        var users = '';
        var room = roomList[i];
        for( var u in room ) {
            var info = room[u];
            users += info.username + ' ';
        }
        m += '<div class="room"><span class="name">' + i + '</span><span class="users">'+users+'</span></div>';

        // 현재 입장 해 있는 방의 정보인가?
        if ( client.getRoomName() == i ) client.onRoomUpdate( room );
    }
    $('.room-list .content').html( m );
};

client.chatUsers = function () {
    return client.chat().find('.users');
};
client.onRoomUpdate = function( room ) {
    if ( client.inLobbyRoom() ) return;
    var users = '';
    for( var u in room ) {
        var info = room[u];
        users += '<span>' + info.username + '</span>';
    }
    client.chatUsers().html( users );
};

client.toggleWhiteboard = function () {
    client.room().toggleClass('whiteboard-layout');
};

/**
 * 사용자가 대기실에 있는지 확인한다.
 * @returns {boolean}
 */
client.inLobbyRoom = function () {
    return client.getRoomName().toLowerCase() == 'lobby';
};

(client.init = function() {

    client.setUsername( client.getUsername() );
    client.joinLobby( client.postJoinRoom );



    var $body = $('body');

    // display video center HTML markup
    $.get('template.html', function( m ) {
        client.box().html( m );
    });

    // username update button
    $body.on('click', '.username button', function() {
        //console.log('.username button clicked');
        var username = $('.username input').val();
        client.setUsername( username );
    });

    //
    $body.on('click', '.join-room button', function(){
        var roomname = $('.join-room input').val();
        //console.log( client.getUsername() + ' joins into ' + roomname);
        app.joinRoom( roomname, client.postJoinRoom );
    });

    $body.on('click', '.room-list .name', function() {
        var name = $(this).text();
        client.joinRoom( name, client.postJoinRoom);
    });

    $body.on('submit', '.chat form', function(e) {
        e.preventDefault();
        var $form = $(this);
        var $message = $form.find('input');
        var roomname = $form.find('.name').text();
        //console.log( getUsername() + ' send message to room("'+roomname+'")" : ' + $message.val() + '"');

        var username = client.getUsername();
        if ( typeof username == 'undefined' || username == '' ) {
            alert("Input user name.");
            return;
        }
        var data = {
            username: username,
            room: roomname,
            text: $message.val()
        };
        client.sendMessage( data, function( re ) {

            // addMessage on recvMessage
            // console.info('callback client.sendMessage: ', re);

        });
    });



    ( function getRoomListLoop() {
        client.roomList( client.onRoomListUpdate );
        setTimeout(getRoomListLoop, 5000);
    })();

    $body.on('click', '#room .leave', function() {
        console.log('leave');
        client.leaveRoom();
    });


    /**
     *
     *
     * @note ...
     *
     */
    $body.on('click', '#room .reconnect', function() {
        if ( client.joined() ) {
            if ( client.inLobbyRoom() ) {
                alert("Refresh the page instead of reconnect since you are in lobby.");
            }
            else {
                location.href = "?mode=reconnect&room=" + client.getRoomName();
            }
        }
        else {
            alert("You cannot re-connect because you are not joined in any room.");
        }
    });


})(); // eo init


