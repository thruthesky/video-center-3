/**
 * @file lobby.js
 *
 * @desc
 *
 */


var lobby = function() {
    return $('#lobby');
};
var lobbyUsername = lobby.username = function () {
    return lobby().find('.username');
};



/**
 *
 *
 * @code

 lobbyBox().hide();
 lobbyBox( name ).show();

 * @endcode
 */
function lobbyBox(name) {
    if ( typeof name == 'undefined' ) return lobby().find('.box');
    else return lobby().find('.box.' + name);
}


var $body = $('body');



/**
 * Show box data for update-username, create-room in lobby.
 */
$body.on('click', '.lobby-menu button', function(){
    var $this = $(this);
    var name = $this.attr('box');
    var $btnLobby = $this.parent('.lobby-menu').find('button');
    $btnLobby.removeClass('selected');
    $this.addClass('selected');
    lobbyBox().hide();
    if ( name ) lobbyBox( name ).show();
});


// This is for updating 'username'
$body.on('submit', '#lobby .username form', function(e) {
    e.preventDefault();
    var $this = $(this);
    var username = $this.find('[name="username"]').val();
    console.log('#entrance .username form submit: ' + username);
    client.setUsername( username, function( my_name ) {
        console.log('username set: ' + username);
        lobbyUsername().hide();
        client.pingRoomList(); // Update room information with the user's new username.
    } );
    return false;
});

$body.on('click', '.lobby-menu .logout', function() {
    console.log('logout');
    client.setUsername( '', function(my_name) {
        leaveRoom();
    });
});


//
$body.on('submit', '.join-room form', function(e){
    e.preventDefault();
    var roomname = $('.join-room input[name="roomname"]').val();
    console.log( client.getUsername() + ' joins into ' + roomname);
    client.joinRoom( roomname, client.postJoinRoom );
    return false;
});

$body.on('click', '.room-list .room', function() {
    var name = $(this).find('.name').text();
    client.joinRoom( name, client.postJoinRoom );
});