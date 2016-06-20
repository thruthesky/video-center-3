
// .......................................................
// Variables
// .......................................................
var connection = new RTCMultiConnection();

// ......................................................
// RTC Multi Connection Code
// ......................................................
connection.socketURL = socketURL;
connection.enableFileSharing = true;
connection.session = {
    audio: true,
    video: true,
    data : true
};
connection.sdpConstraints.mandatory = {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
};
connection.getExternalIceServers = false;
connection.iceServers = [];
connection.iceServers.push({
    url: 'stun:videocenter.co.kr:3478'
});



/**
 * @todo username 과 credential 이 틀려도 접속이 된다. 확인을 해 볼 것.
 */
connection.iceServers.push({
    urls: 'turn:videocenter.co.kr:3478',
    username: 'test_username1',
    credential: 'test_password1'
});

console.log( 'default connection.userid: ' + connection.userid );
var socket = connection.getSocket();


$('body').on('click', '.room-name', function(){
    var $this = $(this);
    var person = $this.text();
    //console.log('connecting to: ' + person);
    //connection.join( person );
    vc.joinRoom( person );
});



/**
 *
 *
 * @param event
 */
connection.onstream = function(event) {
    //console.log('connection id: ' + connection.userid);
    //console.log('event id: ' + event.userid);
    //console.log(connection);

    ///
    roomAddVideo( event );
    videoLayout( Cookies.get('video-list-style') );
};
connection.onstreamended = function(e) {
    console.log('onstreamended', e);
    var userid = e.userid;
    $('[userid="'+userid+'"]').parent().remove();
};
