/**
 * @file client.js
 *
 *
 *
 *
 **/



var client = {};



// ----------------------------------------------------------------------------
// C H A T    C L I E N T   C O D E
// ----------------------------------------------------------------------------
client.box = function() { return $('#videocenter'); };
client.entrance = function() { return $('#entrance'); };

client.lobby = function() { return $('#lobby'); };
client.lobbyMenu = function() { return $('.lobby-menu'); };
client.lobbyMenuContent = function() { return $('.lobby-menu-content'); };
client.lobbyMenuContentBox = function() { return client.lobbyMenuContent().find('.box'); };

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


client.initLobby = function () {
    client.lobbyMenuContentBox().hide();
};
/**
 *
 * This shows 'room' ( including whiteboard, chat-box, document-box, videos )
 *
 * @attention show this when user joins a room ( not lobby room )
 *
 */
client.showLobby = function () {

    console.log('client.showLobby()');

    // return if the user is not in lobby.
    if ( ! client.inLobbyRoom() ) {

        return;
    }
    console.log('client.showLobby()');
    if ( client.entrance().css('display') != 'none' ) client.entrance().hide();
    if ( client.room().css('display') != 'none' ) client.room().hide();

    if ( client.lobby().css('display') == 'none' ) client.lobby().show();
    client.reLayout();
    client.initLobby();
};
client.showRoom = function () {
    if ( client.inLobbyRoom() ) return; // return if the user is in lobby.
    console.log('client.showRoom()');
    if ( client.entrance().css('display') != 'none' ) client.entrance().hide();
    if ( client.lobby().css('display') != 'none' ) client.lobby().hide();
    if ( client.room().css('display') == 'none' ) client.room().show();
    client.reLayout();
};

/**
 *
 * Updates username on server.
 *
 * @fix June 17, 2016 - Username as empty string can be set.
 * @Attention Jun 6, 2016 - It does not set connection info any more.
 * @Attention Before Jun 6, 2016 - It sets 'connection.userid', 'connection.sessionid' also.
 * @param username
 */
client.setUsername = function ( username, callback ) {

    // Empty username can be set for loggout.
    // if (_.isEmpty( username ) ) return;

    console.log('client.setUsername( ' + username + ' )');
    socket.emit('chat-set-username', username, function() {
        console.log('client.setUsername() : callback() : ' + username);
        Cookies.set('username', username, { expires: 365 });
        $('.username input').val(username);
        if ( typeof callback == 'function' ) callback(username);
    });
};

/**
 * It sets user info on server.
 * @note connection.userid & connection.session_id will be set into server.
 * @note more user info can be set by setUsername(), etc.
 */
client.setUserinfo = function ( ) {
    console.log("setUserinfo:");
    var info = {
        session_user_id: connection.userid,
        session_id: connection.session_id
    };
    socket.emit('chat-set-userinfo', info, function(info) {
        console.log("Userinfo is set.");
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
            if ( roomname == 'Lobby' ) {
                return alert("You cannot join Lobby.");
            }
            else {
                socket.emit('chat-room-leave', 'Lobby', function( roomname, my_info ) {
                    console.log('chat-room-leave : ' + roomname, my_info);
                });
            }
        }
        else return alert('Leave current room before you join another room');
    }
    socket.emit('chat-join-room', roomname, function(data) {
        setTimeout(function() {
            connection.openOrJoin( roomname );
        }, 100);
        callback(data);

        // 방에 입장하면, 전자칠판을 다시 그린다.
        socket.emit('get-whiteboard-draw-line-history', client.getRoomName() );
    });
};

client.joinLobby = function( callback ) {
    console.log('client.joinLobby() : ');
    socket.emit('chat-join-room', 'Lobby', function(data) {
        console.log('client.joinLobby() : callback() : ');
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
    else {
        username = client.entrance().find('.username input').val();
        if ( _.isEmpty(username) ) username = client.box().find('.username input').val();
    }
    return username;
};

client.joined = function () {
    return !!client.getRoomName();
};


/**
 * Does what ever needed after join a room.
 *
 * @note call this function right after one joins a room.
 * @note it open lobby if the user joined lobby or it shows the video chat room.
 *
 * @param roomname_joined
 */
client.postJoinRoom = function ( roomname_joined ) {
    var username = client.getUsername();
    console.log( 'client.postJoinRoom() : ' + username + ' joined : ' + roomname_joined );
    // @attention is it needed here?
    // client.setUsername( username, console.log );
    client.setRoomName( roomname_joined );
    connection.extra.socket_id = socket.id;
    connection.extra.username = username;
    connection.updateExtraData();

    if ( client.isLobby( roomname_joined ) ) {
        console.log( 'client.postJoinRoom() : client.isLobby() : ' );
        client.showLobby();
        client.pingRoomList();
    }
    else {
        console.log( 'client.postJoinRoom() : ! client.isLobby() : ' );
        client.clear_canvas();
        client.whiteboard().find('.markup').html('<h2>You are in ' + roomname_joined + '</h2>');
        client.showRoom();
    }

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
 * @note Whiteboard 를 숨기거나 보이기를 하면 상대방의 화면에서 whiteboard 를 똑같이 숨겼다 보였다 해야 한다.
 */
client.toggleWhiteboard = function () {
    client.room().toggleClass('has-whiteboard');
    if ( client.room().find('.has-whiteboard') ) {
        client.room().addClass('.whiteboard');
        socket.emit('room-cast', { 'command' : 'whiteboard-show', 'roomname' : client.getRoomName() });
    }
    else {
        client.room().removeClass('.whiteboard');
        socket.emit('room-cast', { 'command' : 'whiteboard-hide', 'roomname' : client.getRoomName() });
    }
};

/**
 * 사용자가 대기실에 있는지 확인한다.
 * @returns {boolean}
 */
client.inLobbyRoom = function () {
    return client.isLobby( client.getRoomName() )
};
client.isLobby = function( roomname ) {
    return roomname.toLowerCase() == 'lobby';
};

client.addEventHandlers = function () {

    var $body = $('body');

    // username button on #entrance
    $body.on('click', '#entrance .username button', function() {
        console.log('#entrance .username button click');
        var username = $('#entrance').find('.username input').val();
        console.log( username );
        client.setUsername( username, function(username) {
            console.log("username set: " + username);
            client.box().find('[name="username"]').val( username );
            // client.showLobby();
            client.joinLobby( client.postJoinRoom );
        } );
    });

    // This is for updating 'username'
    $body.on('click', '#lobby .username button', function() {
        var $this = $(this);
        var username = $('#lobby').find('.username input').val();
        console.log('#entrance .username button click');
        client.setUsername( username, function( my_name ) {
            console.log('username set: ' + username);
            $this.parent().hide();
            client.pingRoomList(); // Update room information with the user's new username.
        } );
    });

    $body.on('click', '.lobby-menu .logout', function() {
        console.log('logout');
        client.setUsername( '', function(my_name) {
            reload();
        });
    });
    //
    $body.on('click', '.join-room button', function(){
        var roomname = $('.join-room input').val();
        //console.log( client.getUsername() + ' joins into ' + roomname);
        client.joinRoom( roomname, client.postJoinRoom );
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
                alert("Refresh the page instead of reconnect since you are in Lobby.");
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
        var wh = $(window).height() - 100; // 윈도우 세로 크기에서 100을 뺀다. ( 그냥 뺀다. 별 이유 없다 )
        var h = Math.floor(w * 1.4); // whiteboard 넓이의 1.4 배.
        if ( h > wh ) h = wh; // 윈도우 세로 크기에서 100 뺀 값과 whiteboard 너비의 1.4 배 중에서 작은 값을 캔버스 높이로 지정한다. ( 왜? 그냥 ... 적절할 까봐서 )
        client.whiteboard().height( h );

        /**
         * 여기서 반드시 canvas width/height 을 지정해야 한다.
         * @type {Element}
         */
        client.canvas = document.getElementById("whiteboard-canvas");
        client.canvas.width = w;
        client.canvas.height = h;

        // clear drawing history count
        client.whiteboard_draw_line_count = 0;
        // 화면을 재 조정하면 다시 그린다.
        socket.emit('get-whiteboard-draw-line-history', client.getRoomName() );
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


client.setWhiteboardErase = function () {
    client.draw = 'e';
    client.whiteboard().css('cursor', 'pointer'); // apply first
    client.whiteboard().css('cursor', '-webkit-grab'); // apply web browser can.
};

client.clear_canvas = function () {
    // Store the current transformation matrix
    client.canvas_context.save();
    // Use the identity matrix while clearing the canvas
    client.canvas_context.setTransform(1, 0, 0, 1, 0, 0);
    client.canvas_context.clearRect(0, 0, client.canvas.width, client.canvas.height);
    // Restore the transform
    client.canvas_context.restore();
    // clear drawing history count
    client.whiteboard_draw_line_count = 0;
};
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
    /**
     * client.draw can have lower 'L' as 'line', 'e' as 'eraser', 't' as 'text'
     * @type {string}
     */
    client.draw = 'l';


    client.whiteboard_draw_line_count = 0;

    var $body = $('body');
    var $canvas = client.whiteboard().find('canvas');
    //client.canvas = $canvas[0];
    client.canvas = document.getElementById("whiteboard-canvas");
    client.canvas_context = client.canvas.getContext('2d');

    client.canvas.onmousedown = function ( e ) {
        client.mouse.click = true;
        client.mouse.pos_prev = {x: -12345, y: -12345};

        /**
         * @note 그림을 너무 많이 그리면 부하가 걸리므로 총 3천5백 점(선)으로 그릴 수 있도록 제한한다.
         * 이렇게하면 클라이어트(채팅 상대) 마다 약간씩 점의 수치가 틀린데, ( 이것은 각 컴퓨터 사용자 마다 화면 너비가 틀리고, 넓은 화면에서는 10개의 점을 찍어야 하지만, 좁은 화면에서는 4개의 점만 찍어도 가능한 것 때문은 아닐까? 아니다. 왜냐하면 정확히 그리는 사람의 점의 갯수 만큼 상대방의 캔버스에 그리기 때문이다.
         * 서버에서 하면 정확하겠지만, 서버에 무리가 갈 수 있으므로
         * 여기서 제한 한다.
         * 점을 그리는 것과 지우는 것도 필요하므로,
         * 총 3,500 개의 선(점)을 그릴 수 있게 하면 충분한 것 같다.
         */
        if ( client.whiteboard_draw_line_count > 3500 ) {
            alert('Too much draw on whiteboard. Please clear whiteboard before you draw more.');
            client.mouse.click = false;
        }
    };
    client.canvas.onmouseup = function( e ) {
        client.mouse.click = false;
        client.mouse.pos_prev = {x: -12345, y: -12345};
    };
    $canvas.mouseleave( function() {
        client.mouse.click = false;
        client.mouse.pos_prev = {x: -12345, y: -12345}
    });
    /**
     * 누군가가 방에 접속을 해서 또는 누군가가 그림을 그리고 있는 도중에
     * whiteboard clear 를 하면 정상적으로 (깨끗하지 않게) clear 될 수 있다.
     */
    $body.on('click', '.whiteboard button.clear', function() {
        //console.log('1. send clear request 2. get clear request 3. clear');
        socket.emit('whiteboard-clear', client.getRoomName());
    });
    socket.on('whiteboard-clear', function(roomname) {
        console.log('whiteboard-clear: ' + roomname);
        client.clear_canvas();
    });

    $body.on('click', '.whiteboard button.eraser', client.setWhiteboardErase);

    client.whiteboard_draw_line = function( data ) {
        var w = client.whiteboard().width();
        var h = client.whiteboard().height();
        var line = data.line;
        //console.log( line );
        var ox = line[0].x * w;
        var oy = line[0].y * h;
        var dx = line[1].x * w;
        var dy = line[1].y * h;

        if ( data.draw == 'e' ) {
            var radius = 10; // or whatever
            //var fillColor = '#ff0000';
            client.canvas_context.globalCompositeOperation = 'destination-out';
            //client.canvas_context.fillCircle(dx, dy, radius, fillColor);
            client.canvas_context.fillStyle = '#ff0000';
            client.canvas_context.beginPath();
            client.canvas_context.moveTo(dx, dy);
            client.canvas_context.arc( dx, dy, radius, 0, Math.PI * 2, false );
            client.canvas_context.fill();

        }
        else {
            client.canvas_context.beginPath();
            client.canvas_context.moveTo( ox, oy);
            client.canvas_context.lineTo( dx, dy);
            client.canvas_context.strokeStyle="red";
            client.canvas_context.stroke();
            client.whiteboard_draw_line_count ++;
        }
        //console.log('client.whiteboard_draw_line_count:' + client.whiteboard_draw_line_count);
    };

    /**
     *
     * 내가 그림을 그리는 경우, 상대방이  그림을 그릴 때, delay 를 0.1 초 준다. 왜? 그냥...
     * 너무 많이 delay 시키면 실제로 상대방의 전자칠판에 그림이 늦게 그려진다.
     */
    socket.on('whiteboard-draw-line', function(data){
        setTimeout(function(){
            client.whiteboard_draw_line(data);
        },100);
    });

    /**
     *
     * 방에 처음 접속 할 때, 또는 화면을 resize 할 때, 서버로 부터 기존 그림 정보를 받는다.
     * 그릴 그림이 많은 경우, ( 방에 처음 접속 했을 때, 서버에서 받는 그림 정보 기록이 많은 경우 )
     * 부하를 많이 먹으므로 1.45 초 딜레이 시킨다.
     *
     */
    socket.on('whiteboard-draw-line-history', function(data) {
        setTimeout(function(){
            client.whiteboard_draw_line(data);
        },1450);
    });


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
        //var rx = (x / w);//.toFixed(4);
        //var ry = (y / h);//.toFixed(4);

        var rx = (x / w).toFixed(4);
        var ry = (y / h).toFixed(4);
        //console.log('relative x: ' + rx + ', y: ' + ry);

        client.mouse.pos.x = rx;
        client.mouse.pos.y = ry;

        if ( client.mouse.pos_prev.x == -12345 ) {
            client.mouse.pos_prev.x = client.mouse.pos.x;
            client.mouse.pos_prev.y = client.mouse.pos.y;
        }

        //console.log( 'prev', client.mouse.pos_prev );
        //console.log( client.mouse.pos );

        var data =  { line : [client.mouse.pos, client.mouse.pos_prev] };
        data.roomname = client.getRoomName();
        data.draw = client.draw;

        socket.emit('whiteboard-draw-line', data);
        client.whiteboard_draw_line( data );

        client.mouse.pos_prev.x = client.mouse.pos.x;
        client.mouse.pos_prev.y = client.mouse.pos.y;


    };
};

/**
 * Updates room list. Call this function whenever you want to update the lobby room list.
 */
client.pingRoomList = function () {
    client.roomList( client.onRoomListUpdate );
};
/**
 * Initialize videocenter
 */
client.init = function() {



    client.setUserinfo();
    var username = client.getUsername();

    // Load HTML of VC and display video center( HTML markup )
    $.get('template.html', function( m ) {
        client.box().html( m );

        /**
         * User has name already? then, join the lobby.
         */
        if (_.isEmpty(username) ) {
        }
        else {
            client.setUsername( username, function( my_name ) {
                console.log('client.init() : client.setUsername() : ');
                client.joinLobby( client.postJoinRoom );
            } );

        }


        // init whiteboard even the user didn't join any room.
        client.initWhiteboard();
    });

    client.addEventHandlers();

    ( function getRoomListLoop() {
        client.pingRoomList();
        setTimeout(getRoomListLoop, 4000);
    })();


    $(window).resize( _.debounce( client.reLayout, 200 ) );

    setTimeout( client.toggleWhiteboard, 200 ); // 시작 할 때, WhiteBoard 를 표시한다.

    setTimeout( client.reLayout, 500 ); // 시작 할 때, 레이아웃 조정



    $('body').on('click', '.lobby-menu button', function(){
        var $this = $(this);
        var box = $this.attr('box');
        $(".box." + box).show();
    });
}; // eo init

$(function() {
    client.init();



    /**
     * .........................................................
     *
     * Initialization
     *
     * .........................................................
     */



    var q = getQueryString();
    if ( typeof q['reload'] != 'undefined' ) {
        $('.join-room input').val('Apple is delicious!');
        $('.join-room button').click();
        setTimeout( reload, q['reload'] * 1000 );
    }

    /**
     * 이 코드는 재 접속을 할 때, 자동으로 이전 룸에 다시 접속하게 하는 코드이다.
     */
    if ( typeof q['mode'] != 'undefined' && q['mode'] == 'reconnect' ) {
        setTimeout(function() {
            q['room'] = decodeURI(q['room']);
            console.log('reconnecting: ' + q['room']);
            $('.join-room input').val( q['room'] );
            $('.join-room button').click();
        }, 200);
    }

});

