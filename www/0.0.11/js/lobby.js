
var $body = $('body');



/**
 * Show box data for update-username, create-room in lobby.
 */
$body.on('click', '.lobby-menu button', function(){
    var $this = $(this);
    var name = $this.attr('box');
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

$body.on('click', '.room-list .name', function() {
    var name = $(this).text();
    client.joinRoom( name, client.postJoinRoom );
});