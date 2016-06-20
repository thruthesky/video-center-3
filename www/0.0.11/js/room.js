
/**
 * Leave entire room
 *
 *
 */
/*
client.leaveRoom = function () {
    location.href = '?show_header=Y&show_header_menu=Y&show_entrance=Y';
    //reload();


     //connection.getAllParticipants().forEach(function(participantId) {
        //connection.disconnectWith(participantId, function() {
            //console.log( 'disconnectedWith: ' + participantId );
            //callback();
        //});
    //});

};
*/


function leaveRoom() {
    location.href = '?show_header=Y&show_header_menu=Y&show_entrance=Y';
}
function joinLobby() {
    location.href = '?show_header=Y&show_header_menu=Y&roomname=lobby&joinRoom=Y&username=' + client.getUsername();
}


body().on('click', '#room .leave', function() {
    console.log('leave');

    joinLobby();

//    client.leaveRoom();

    /**
    client.joinLobby(function(data){
        console.log(data);
        client.postJoinRoom( data );
    });
     */


});




/**
 *
 *
 * 재접속을 한다.
 */
$body.on('click', '#room .reconnect', function() {
    if ( client.joined() ) {
        if ( client.inLobbyRoom() ) {
            alert("Refresh the page instead of reconnect since you are in Lobby.");
        }
        else {
            location.href = "?joinRoom=Y&roomname=" + client.getRoomName() + '&username=' + client.getUsername();
        }
    }
    else {
        alert("You cannot re-connect because you are not joined in any room.");
    }
});

