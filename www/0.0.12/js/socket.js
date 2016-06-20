
/** -------------------------------------------------------------------------
 *
 * S O C K E T    C O D E
 *
 *
 *
 *///------------------------------------------------------------------------

$(function(){

    if ( typeof socket == 'undefined' ) {
        alert("Socket is undefined. Please check the connectivity to the socket server: " + socketURL);
    }
    else {
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
    }

});
