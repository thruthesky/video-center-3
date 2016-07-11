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

client.showEntrance = function () {
    client.entrance().show();
    $('header').show();
    $('.header-menu').show();
    client.lobby().hide();
    client.room().hide();
};

/**
 *
 * Sets/Updates username on server and all the input box which has name="username"
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
        $('input[name="username"]').val(username);
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
    chat_add_message( data );
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
        wb.clear_canvas();
        //whiteboard().find('.markup').html('<h2>You are in ' + roomname_joined + '</h2>');
        client.showRoom();
    }

};

/**
 *
 *
 * When page loaded, run this method forever to update room information.
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
        m += '<div class="room"><img src="img/room-list-door.png"><span class="name">' + i + '</span><span class="users">'+users+'</span></div>';


        // Is it my room information?
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
/*
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
    */




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
        var w = whiteboard().width();
        var wh = $(window).height() - 100; // 윈도우 세로 크기에서 100을 뺀다. ( 그냥 뺀다. 별 이유 없다 )
        var h = Math.floor(w * 1.4); // whiteboard 넓이의 1.4 배.
        if ( h > wh ) h = wh; // 윈도우 세로 크기에서 100 뺀 값과 whiteboard 너비의 1.4 배 중에서 작은 값을 캔버스 높이로 지정한다. ( 왜? 그냥 ... 적절할 까봐서 )
        whiteboard().height( h );

        /**
         * 여기서 반드시 canvas width/height 을 지정해야 한다.
         * @type {Element}
         */
        //wb.canvas = document.getElementById("whiteboard-canvas");
        wb.canvas.width = w;
        wb.canvas.height = h;

        // clear drawing history count
        wb.whiteboard_draw_line_count = 0;
        // 화면을 재 조정하면 다시 그린다.
        socket.emit('get-whiteboard-draw-line-history', client.getRoomName() );
    }

};

/**
 * Updates room list. Call this function whenever you want to update the lobby room list.
 */
client.pingRoomList = function () {
    client.roomList( client.onRoomListUpdate );
};


/**
 * 사용자 이름을 지정하면, Lobby 로 접속한다.
 * @param username
 */
client.joinLobbyWithUsername = function (username) {
    if ( username == '' ) return alert("joinLobbyWithUsername: User name is empty");
    client.setUsername( username, function( my_name ) {
        console.log('client.init() : client.setUsername() : ');
        client.joinLobby( client.postJoinRoom );
    } );
};


/**
 * 방 이름과 사용자 이름을 지정하면 해당 방으로 접속한다.
 * @param roomname
 * @param username
 */
client.joinRoomWithUsername = function (roomname, username) {
    if ( roomname == '' ) return alert("joinRoomWithUsername: Room name is empty");
    if ( username == '' ) return alert("joinRoomWithUsername: User name is empty");
    client.setUsername( username, function( my_name ) {
        console.log('client.joinRoomWithUsername : ' + my_name + ', roomname: ' + roomname);
        client.joinRoom( roomname, client.postJoinRoom );
    } );
};
/**
 * Initialize videocenter
 */
client.init = function( o ) {




    client.setUserinfo();
    var username = client.getUsername();

    // Load HTML of VC and display video center( HTML markup )



        var template = _.template( $('#template').html() );
        var markup = template({
            'company_name' : 'Withcenter, Inc.',
            'ceo_name' : 'Withcenter, Inc.',
            'phone_number' : '070-7893-1741',
            'kakaotalk' : 'thruthesky2',
            'email' : 'thruthesky@gmail.com',
            'address' : '경남 김해시 대성동 대성아파트 나동 209호',
            'Ymd' : 2016
        });
        //console.log(markup);

        client.box().html( markup );


        /**
         * User has name already? then, join the lobby.
         */
        /*
        if (_.isEmpty(username) ) {
        }
        else {
            client.joinLobbyWithUsername(username);
        }
        */



        if ( o.show_header ) $('header').show();
        if ( o.show_header_menu ) $('.header-menu').show();
        if ( o.show_entrance ) client.entrance().show();

        if (o.username) client.setUsername(o.username);

        if ( o.joinLobby ) client.joinLobbyWithUsername(o.username);
        if ( o.joinRoom ) client.joinRoomWithUsername(o.roomname, o.username);

        // init whiteboard even the user didn't join any room.

        wb.init();




    client.addEventHandlers();

    ( function getRoomListLoop() {
        client.pingRoomList();
        setTimeout(getRoomListLoop, 4000);
    })();



    $(window).resize( _.debounce( client.reLayout, 200 ) );

    setTimeout( whiteboard.toggle(), 200 ); // 시작 할 때, WhiteBoard 를 표시한다.

    setTimeout( client.reLayout, 500 ); // 시작 할 때, 레이아웃 조정



}; // eo init

$(function() {

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


    /** 자동 로그인 & Lobby join */
    var username = '',
        roomname = '',
        show_header = false,
        show_header_menu = false,
        show_entrance = false,
        joinLobby = false,
        joinRoom = false;
    if ( typeof q['username'] != 'undefined' ) username = q['username'];
    if ( typeof q['roomname'] != 'undefined' ) roomname = q['roomname'];
    if ( typeof q['show_header'] != 'undefined' && q['show_header'] == 'Y' ) show_header = true;
    if ( typeof q['show_header_menu'] != 'undefined' && q['show_header_menu'] == 'Y' ) show_header_menu = true;
    if ( typeof q['show_entrance'] != 'undefined' && q['show_entrance'] == 'Y' ) show_entrance = true;
    if ( typeof q['joinLobby'] != 'undefined' && q['joinLobby'] == 'Y' ) joinLobby = true;
    if ( typeof q['joinRoom'] != 'undefined' && q['joinRoom'] == 'Y' ) joinRoom = true;



    var o = {
        'show_header'       : show_header,      // 상단 헤더 표시
        'show_header_menu'  : show_header_menu, // 상단 헤더 메뉴 표시
        'show_entrance'     : show_entrance,    // 대문. 로그인 페이지 보여 주기.
        'username'          : username,         // 사용자 이름을 설정.
        'roomname'          : roomname,         // 방이름. ( joinRoom 이 true 일 때 유효. )
        'joinLobby'         : joinLobby,        // true 이면, 로그아웃을 하면 페이지가 reload 되고 다시 이 값이 적용되므로 자동 로그인.
        'joinRoom'          : joinRoom          // true 이면 로그아웃을 할 때, page reload 되므로 다시 해당 방에 들어간다.
    };

    console.log(o);


    /**
     * 채팅 설정
     */
    client.init(o);


    /*
     * 자동으로 채팅 창에 채팅 메세지 입력.
    var no = 0;
    (
    function say() {
        $('.chat form [name="message"]').val("Hello, How are you? - "+ ( ++ no ));
        $('.chat form').submit();
        setTimeout( say, 500);
    })
    ();
    */

});

