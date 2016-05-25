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
socket.on ('recv-message', function( data ) {
    console.info('socket.on("recv-message") : ', data);
    client.recvMessage( data );
});

socket.on ('user-join', function( username ) {
    //console.log('new user joined : ' + username);
    client.userJoin( username );
});

client.userLeave = function (info) {
    client.addMessage( info.username + ' leaves');
};
socket.on ('room-leave', function( info ) {
    // console.error( 'socket.on("room-leave")', info );
    client.userLeave( info );
});




// ----------------------------------------------------------------------------
// C H A T    C L I E N T   C O D E
// ----------------------------------------------------------------------------
client.box = function() { return $('#videocenter'); }
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
    socket.emit('room-list', callback);
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



(client.init = function() {

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
        app.joinRoom( roomname, function( roomname_joined ) {
            //console.log( client.getUsername() + ' joined : ' + roomname_joined );
            app.setRoomName( roomname_joined );
        });
    });

    $body.on('click', '.room-list .name', function() {
        var name = $(this).text();
        client.joinRoom( name, function( roomname ) {
            // if you come here. you joined room.
            //console.log( client.getRoomName() + ' joined room : ' + roomname );
        });
    });

    $body.on('submit', '.chat form', function(e) {
        e.preventDefault();
        var $form = $(this);
        var $message = $form.find('input');
        var roomname = $form.find('.name').text();
        //console.log( getUsername() + ' send message to room("'+roomname+'")" : ' + $message.val() + '"');
        var data = {
            username: client.getUsername(),
            room: roomname,
            text: $message.val()
        };
        client.sendMessage( data, function( re ) {

            // addMessage on recvMessage
            // console.info('callback client.sendMessage: ', re);

        });
    });



    ( function getRoomListLoop() {
        client.roomList(function(roomList){
//            console.log(roomList);
            var m = '';
            for ( var i in roomList ) {
                var users = '';
                var room = roomList[i];
                for( var u in room ) {
                    var info = room[u];
                    users += info.username + ' ';
                }
                m += '<div class="room"><span class="name">' + i + '</span><span class="users">'+users+'</span></div>';

            }
            $('.room-list .content').html( m );
        });
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
            location.href = "?mode=reconnect&room=" + client.getRoomName();
        }
        else {
            alert("You cannot re-connect because you are not joined in any room.");
        }
    });


})();


/**
 * @Attention It sets 'connection.userid', 'connection.sessionid' also.
 * @param username
 */
client.setUsername = function ( username ) {
    if ( ! username ) return;
    //console.log('client.setUsername : ', username);
    var info = {
        username : username,
        session_user_id: connection.userid,
        session_id : connection.sessionid
    };
    //console.log( info );
    socket.emit('set-user-info', info, function( info ) {
        //console.log('callback client.setUsername', info);
        Cookies.set('username', info.username, { expires: 365 });
        client.box().find('[name="username"]').val( info.username );
        //console.log('callback setUsername : -----------');
        //console.log(connection.userid);
        //console.log(info);
    });
};

client.userList = function( callback ) {
    socket.emit('user-list', callback);
};

/**
 *
 * @param roomname
 * @param callback
 */
client.joinRoom = function (roomname, callback) {

    if ( client.joined() ) return alert('Leave current room before you join another room');
    var username = client.getUsername();
    console.info( username + ' joins into : ' + roomname );
    socket.emit('join-room', roomname, function(data) {
        client.setRoomName( roomname );
        connection.extra.socket_id = socket.id;
        connection.extra.username = username;
        connection.updateExtraData();
        connection.openOrJoin( roomname );
        callback(data);
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
    socket.emit('send-message', data, callback);
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
