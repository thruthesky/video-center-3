
var $body = $('body');

$body.on( 'submit', '#entrance form', function(e) {
    e.preventDefault();
    var username = $(this).find('[name="username"]').val();
    console.log('entrance form submit: username:' + username);
    client.setUsername( username, function(username) {
        console.log("username set: " + username);
        client.box().find('[name="username"]').val( username );
        // client.showLobby();
        client.joinLobby( client.postJoinRoom );
    } );
    return false;
});