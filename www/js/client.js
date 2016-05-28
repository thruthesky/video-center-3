// ----------------------------------------------------------------------------
// S O C K E T   C O D E
// ----------------------------------------------------------------------------

var client = app = {};
//client.users = {};


socket.on('connect', function () {

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
client.roomContent = function() { return client.room().find('.content'); };
client.chat = function () {
    return client.room().find('.chat');
};
client.messages = function () {
    return this.chat().find('.messages');
};


client.roomList = function (callback) {
    socket.emit('chat-room-list', callback);
};
client.whiteboard = function () { return client.room().find('.whiteboard'); };

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

        // 방에 입장하면, 전자칠판을 다시 그린다.
        socket.emit('get-whiteboard-draw-line', client.getRoomName() );
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
};
client.getRoomName = function() {
    return client.chat().find('.name').text();
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

/**
 * whiteboard 를 보였다 숨겼다 한다.
 */
client.toggleWhiteboard = function () {
    client.room().find('.whiteboard').toggle();
    client.room().toggleClass('has-whiteboard')
};

/**
 * 사용자가 대기실에 있는지 확인한다.
 * @returns {boolean}
 */
client.inLobbyRoom = function () {
    return client.getRoomName().toLowerCase() == 'lobby';
};

client.addEventHandlers = function () {


    var $body = $('body');

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


};


/**
 * 화면 너비/높이가 변경 될 때, 각종 레이아웃을 재 조정한다.
 * 이 함수는 수동으로 마우스 클릭하여 조정되는 것 뿐만아니라
 * #room .content 의 항목이 (비디오 등의 추가/삭제) 변경 될 때마다 호출 되어야 한다.
 * 즉, #room .content 의 너비가 변경 될 때 마다 호출 되는 것이 좋다.
 *
 *
 */
client.reLayout = function () {

    if ( client.room().hasClass('has-whiteboard') ) {

        var w = client.whiteboard().width();
        var wh = $(window).height() - 100;
        var h = Math.floor(w * 1.4);
        if ( h > wh ) h = wh;
        client.whiteboard().height( h );

        /**
         * 여기서 반드시 canvas width/height 을 지정해야 한다.
         * @type {Element}
         */
        client.canvas = document.getElementById("whiteboard-canvas");
        client.canvas.width = w;
        client.canvas.height = h;

        // 화면을 재 조정하면 다시 그린다.
        socket.emit('get-whiteboard-draw-line', client.getRoomName() );
    }

};
function onMousemove(e){
    var m_posx = 0, m_posy = 0, e_posx = 0, e_posy = 0,
        obj = this;
    //get mouse position on document crossbrowser
    if (!e){e = window.event;}
    if (e.pageX || e.pageY){
        m_posx = e.pageX;
        m_posy = e.pageY;
    } else if (e.clientX || e.clientY){
        m_posx = e.clientX + document.body.scrollLeft
            + document.documentElement.scrollLeft;
        m_posy = e.clientY + document.body.scrollTop
            + document.documentElement.scrollTop;
    }
    //get parent element position in document
    if (obj.offsetParent){
        do {
            e_posx += obj.offsetLeft;
            e_posy += obj.offsetTop;
        } while (obj = obj.offsetParent);
    }
    // mouse position minus elm position is mouseposition relative to element:
    dbg.innerHTML = ' X Position: ' + (m_posx-e_posx)
        + ' Y Position: ' + (m_posy-e_posy);
}


/**
 * Whiteboard 초기화 : 페이지 로딩 시 한번만 호출 되어야 한다.
 */
client.initWhiteboard = function () {
    client.mouse = {
        click: false,
        move: false,
        pos: { x:0, y:0 },
        pos_prev: { x: 0, y: 0 }
    };
    var $canvas = client.whiteboard().find('canvas');
    //client.canvas = $canvas[0];
    client.canvas = document.getElementById("whiteboard-canvas");
    client.canvas_context = client.canvas.getContext('2d');

    client.canvas.onmousedown = function ( e ) {
        client.mouse.click = true;
        client.mouse.pos_prev = {x: -12345, y: -12345};
    };
    client.canvas.onmouseup = function( e ) {
        client.mouse.click = false;
        client.mouse.pos_prev = {x: -12345, y: -12345};
    };
    $canvas.mouseleave( function() {
        client.mouse.click = false;
        client.mouse.pos_prev = {x: -12345, y: -12345}
    });
    client.whiteboard_draw_line = function( data ) {
        var w = client.whiteboard().width();
        var h = client.whiteboard().height();
        var line = data.line;
        var ox = line[0].x * w;
        var oy = line[0].y * h;
        var dx = line[1].x * w;
        var dy = line[1].y * h;
        client.canvas_context.beginPath();
        client.canvas_context.moveTo( ox, oy);
        client.canvas_context.lineTo( dx, dy);
        client.canvas_context.strokeStyle="red";
        client.canvas_context.stroke();

        console.log( ox, oy );
        console.log( dx, dy );
    };
    socket.on('whiteborad-draw-line', client.whiteboard_draw_line);

    /**
     * whiteboard 의 상대적 마우스 포인트를 얻는다.
     * @param e
     */
    client.canvas.onmousemove = function ( e ) {
        if ( ! client.mouse.click ) return;

        var m_posx = 0, m_posy = 0, e_posx = 0, e_posy = 0,
            obj = this;
        //get mouse position on document crossbrowser
        if ( ! e ) e = window.event;
        if (e.pageX || e.pageY){
            m_posx = e.pageX;
            m_posy = e.pageY;
        } else if (e.clientX || e.clientY){
            m_posx = e.clientX + document.body.scrollLeft
                + document.documentElement.scrollLeft;
            m_posy = e.clientY + document.body.scrollTop
                + document.documentElement.scrollTop;
        }
        //get parent element position in document
        if ( obj.offsetParent){
            do {
                e_posx += obj.offsetLeft;
                e_posy += obj.offsetTop;
            } while ( obj = obj.offsetParent);
        }
        var x = m_posx-e_posx;
        var y = m_posy-e_posy;

        var w = client.whiteboard().width();
        var h = client.whiteboard().height();
        var rx = (x / w);//.toFixed(4);
        var ry = (y / h);//.toFixed(4);
        //console.log('relative x: ' + rx + ', y: ' + ry);

        client.mouse.pos.x = rx;
        client.mouse.pos.y = ry;

        if ( client.mouse.pos_prev.x == -12345 ) {
            client.mouse.pos_prev.x = client.mouse.pos.x;
            client.mouse.pos_prev.y = client.mouse.pos.y;
        }

        console.log( 'prev', client.mouse.pos_prev );
        console.log( client.mouse.pos );

        var data =  { line : [client.mouse.pos, client.mouse.pos_prev] };
        data.roomname = client.getRoomName();
        socket.emit('whiteborad-draw-line', data);

        client.whiteboard_draw_line( data );

        client.mouse.pos_prev.x = client.mouse.pos.x;
        client.mouse.pos_prev.y = client.mouse.pos.y;


    };
};
client.init = function() {

    client.setUsername( client.getUsername() );
    client.joinLobby( client.postJoinRoom );

    // display video center HTML markup
    $.get('template.html', function( m ) {
        client.box().html( m );
        client.initWhiteboard();
    });

    client.addEventHandlers();

    ( function getRoomListLoop() {
        client.roomList( client.onRoomListUpdate );
        setTimeout(getRoomListLoop, 5000);
    })();


    $(window).resize( _.debounce( client.reLayout, 200 ) );


    setTimeout( client.toggleWhiteboard, 200 ); // 시작 할 때, WhiteBoard 를 표시한다.

    setTimeout( client.reLayout, 500 ); // 시작 할 때, 레이아웃 조정

}; // eo init

$(function() {
    client.init();
});

