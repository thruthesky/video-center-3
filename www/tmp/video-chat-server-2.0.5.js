
/** define variables */
var chat_socket;
var chat_my_room;
var trace_count = 0;
var $connected = new Array();			// connected users in the room

var $chat_user_name = false;
var $chat_room_name = 'lobby';
var $chat_observer = false;

var webrtc_support = true;
var timer_resize = -1;

var canvas_context;

var i_am_room_owner = false;


/**
 *  Initialization option variable // https://docs.google.com/document/d/1KjTuSAdInlAsEC2kkbUn7mp-CTw7b22-VL7AE7pXFZE/edit#heading=h.e1rpjtixa6hm
 */
var $init_opt = {}
$init_opt['lang input chat user name'] = "Please input chat user name";
$init_opt['lang cannot enter lobby'] = "You cannot enter lobby";
$init_opt['lang guest'] = "Guest";



/** initialize codes */

if (navigator.mozGetUserMedia) {
} else if (navigator.webkitGetUserMedia) {
}
else {
	webrtc_support = false;
}

var scripts= document.getElementsByTagName('script');
var mysrc= scripts[scripts.length-1].src;


/**
 *  웹 서버 주소를 인클루드 된 JS 의 주소를 보고 자동으로 찾는다.
 */
var url_video_chat_server = mysrc.replace(/video-chat-server-2.[0-9].[0-9]+.js$/, '');
//trace("url_video_chat_server:" + url_video_chat_server);

/**
 *  각종 주소 초기화
 */
var url_whiteboard = url_video_chat_server + 'whiteboard.index.php';



/**
 * 만약, url_socket_server 가 지정되지 않았으면,
 * 기본 서버를 지정한다.
 *
 */
if ( typeof url_socket_server == 'undefined' ) {
	var url_socket_server = "https://www.videocenter.co.kr:443";
}




/** loading scripts */
document.write("<script type='text/javascript' src='"+url_socket_server+"/easyrtc/easyrtc.js'></script>");
document.write("<script type='text/javascript' src='"+url_socket_server+"/socket.io/socket.io.js'></script>");


/**
 *  초기화 설정 함수
 */
function init_opt( key, value )
{
	$init_opt[ key ] = value;
}
/**
 *  윈도우 메세지 이베트
 *  
 *  message listener
 */
window.addEventListener('message', postMessgeListener, false);
function postMessgeListener( e )
{
	/**
	 *  자신이 직접 전자칠판의 파일을 연경우,
	 */
	if ( e.data.code == 'white-board-file-select' ) {
		whiteboard_iframe_open( url_video_chat_server + 'whiteboard-book.php?path=' + e.data.path );
		whiteboard_iframe_open_broadcast( url_video_chat_server + 'whiteboard-book.php?path=' + e.data.path );
	}
	/**
	 *  자신이 직접 E-Book 을 연 경우,
	 */
	if ( e.data.code == 'genebook-open' ) {
		var url = e.data.url + '&url=no';
		whiteboard_iframe_open( url );	// 자기는 이미 열었으므로,
		whiteboard_iframe_open_broadcast( url );	// 브로드캐스팅으로 다른 사용자의 전자칠판 iframe 을 연다.
	}
	if ( e.data.code == 'page-scroll' ) {
		var top = e.data.top;
		whiteboard_iframe_scroll_broadcast( top );
	}
}



var $room_setting;			// room settings.
var $room_init = false;	// it is true when the room is being initialized.
var $whiteboard_buton_clicked = false; // it is true when the whiteboard is begin open/close by myself.
var $window_resized = false; // it is true when window resized and it becomes false after the callback finish.
var $video_chat_room;
var $video_chat_lobby;
var $lobby_chat_input;
var $lobby_chat_send;
var $lobby_chat_display;
var $whiteboard;			// it is initialized right after whiteboard open.
$(function(){


	/**
	 *  	Add lobby chat box
	 *  	This must come first before init variable.
	 */
	add_chat_box_to_lobby();

	/** initialize variables */
	
	$video_chat_room = $('.video-chat-room');
	$video_chat_lobby = $('.video-chat-lobby');
	
	$lobby_chat_input = $(".video-chat-lobby [name='message']");
	$lobby_chat_send = $('.video-chat-lobby .send');
	$lobby_chat_display = $(".video-chat-lobby .chat-message");
	

	/** 
	 *  Initailzation condition
	 *  
	 */
	// get user name check if
	var user_name = $.cookie('chat_user_name');
	if ( typeof user_name != 'undefined' && user_name != '' ) {
		$chat_user_name = user_name;
		$("[name='chat_user_name']").val( $chat_user_name );
		
		
		// 사용자 이름이 있어야지만, 기존의 대화방 정보를 표시한다.
		// get check room name if
		// 쿠키에 기록된 채팅 방 이름이 있으면 그 방을 이용한다. 기본 : lobby
		var room_name = $.cookie('chat_room_name');
		if ( room_name != '' ) $chat_room_name = room_name;
	}
	else {
		if ( typeof callback_input_chat_user_name == 'function' ) callback_input_chat_user_name();
		$chat_user_name = '';
		$chat_room_name = '';
	}
	
	
	// 
	if ( typeof $chat_room_name == 'undefined' || $chat_room_name == '' ) {
		// alert("chat room name is empty. it must be at least lobby");
		$chat_room_name = 'lobby';
		$.cookie('chat_room_name', 'lobby');
	}
	else {
		//trace("My room: " + $chat_room_name);
	}
	
	
	/** windows init */
	//trace("Initializing $(window).resize()");
	$(window).resize(function(){
		clearTimeout(timer_resize);
		timer_resize = setTimeout(function(){
			if ( typeof callback_window_resized == 'function' ) {
				$window_resized = true;
				callback_window_resized();
				$window_resized = false;
			}
		}, 500);
	});

	
	
	/** initialization */
	//trace("Initializing easyRTC");
	easyrtc.setSocketUrl( url_socket_server );
	easyrtc.setOnError( function( e ) { trace( 'easyrtc.setOnError() : ' + e.errorText); } );
	easyrtc.setPeerListener( peerListener );	// for easyrtc data & chat stream ( chat message and whiteboard message )
	easyrtc.setRoomOccupantListener( roomOccupantListener );
	easyrtc.setStreamAcceptor( streamAcceptor );
	easyrtc.setOnStreamClosed( streamClosed );
	easyrtc.setAcceptChecker( streamChecker );
	easyrtc.setRoomEntryListener(roomEntryListener);
	easyrtc.setDisconnectListener(function() {
        trace("easyRTC disconnect listener fired. (SYSTEM-ERROR) Lost our connection to the socket server");
    });
	


	/* socket.io 초기화 */
	//trace("Initializing socket.io for chat_socket");
	try {
		chat_socket = io.connect( url_socket_server );
	}
	catch ( e ) {
		alert ( e.message );
	}
	
	chat_socket.on('chat', socket_io_chat_data_from_server);
	chat_socket.on('connect', socket_connect);
	chat_socket.on('connecting', socket_connecting);
	chat_socket.on('disconnect', socket_disconnect);
	chat_socket.on('connect_failed', socket_connect_failed);
	chat_socket.on('error', socket_error);
	chat_socket.on('reconnect_failed', socket_reconnect_failed);
	chat_socket.on('reconnect', sooket_reconnect);
	chat_socket.on('reconnecting', socket_reconnecting);
		
		
	
	
	//trace("Initializing for video chat room event handlers");
	/** chat room management */
	$('body').on('click', '.room-name', on_room_name);
	
	$('body').on('click', '.enter-room', on_enter_room);
	on_keypress( "[name='chat_room_name']", on_enter_room );
	
	$('.save-user-name').click( on_save_user_name );
	on_keypress( "[name='chat_user_name']", on_save_user_name );
	
	
	/** lobby chat-box */
	on_keypress( $lobby_chat_input, socket_io_chat_send_message );
	$('body').on('click', $lobby_chat_send, socket_io_chat_send_message );
	/** EO **/
	
	/** video chat room chat-box */
	on_keypress( "#video-chat-room .chat-input [name='message']", video_chat_message_send );
	$('body').on('click', '#video-chat-room .chat-input .send', video_chat_message_send );
	/** EO **/
	
	/** video chat room button */
	$('body').on('click', '#video-chat-room-button .camera', video_chat_room_camera );
	$('body').on('click', '#video-chat-room-button .sound', video_chat_room_sound );
	$('body').on('click', '#video-chat-room-button .leave', video_chat_room_leave );
	//$('body').on('click', '#video-chat-room-button .password', video_chat_room_password );
	$('body').on('click', '#video-chat-room-button .roomlist', video_chat_room_roomlist );
	$('body').on('click', '#video-chat-room-button .whiteboard', video_chat_room_whiteboard );
	

	
	/* white board drawing event handlers */	
	$('body').on('mousedown', '#white-board #canvas', whiteboard_canvas_draw_begin);
	$('body').on('mousemove', '#white-board #canvas', whiteboard_canvas_draw_move);
	$('body').on('mouseup', '#white-board #canvas', whiteboard_canvas_draw_end);
	$('body').on('mouseleave', '#white-board #canvas', whiteboard_canvas_draw_end);	// 마우스가 캔버스 밖으로 나가면, 그리기를 종료한다.
	

	/* white board mneu button handlers	*/

	$('body').on('click', '#white-board .menu .open', whiteboard_menu_open);
	$('body').on('click', '#white-board .menu .ebook', on_click_white_board_menu_ebook);
	$('body').on('click', '#white-board .menu .web', whiteboard_menu_web);
	$('body').on('click', '#white-board .menu .draw', whiteboard_menu_draw);
	$('body').on('click', '#white-board .menu .pen', whiteboard_menu_pen);
	$('body').on('click', '#white-board .menu .type', whiteboard_menu_type);
	$('body').on('click', '#white-board .menu .color', whiteboard_menu_color);
	$('body').on('click', '#white-board .menu .eraser', whiteboard_menu_eraser);
	$('body').on('click', '#white-board .menu .clear', whiteboard_menu_clear);
	
	//text input
	$('body').on('click', '#white-board .submit_text', whiteboard_input_text);
	
	$('body').on('click', '.kickout', on_kickout);
	
	
	/* 웹 페이지 오픈 popup 핸들러 */
	/**
	$('body').on('click', '#white-board-menu-web-open-submit', whiteboard_menu_web_popup_submit);
	on_keypress( '#white-board-menu-web-open-box', whiteboard_menu_web_popup_submit );
	*/
	
	/* color picker popup event handler */
	$('body').on('click', '#white-board #white-board-menu-color-popup span', whiteboard_menu_color_popup_submit);
	
	
	
	
	

	
	/**
	 *  @warning this code must be at the end of init.
	 *  
	 *  https://docs.google.com/document/d/1KjTuSAdInlAsEC2kkbUn7mp-CTw7b22-VL7AE7pXFZE/edit#heading=h.mp06jb65hdj9
	 *  
	 */
	if ( webrtc_support && $chat_user_name && $chat_room_name != 'lobby' ) {
		//trace("Join video chat room : room name="+$chat_room_name+", user name=" + $chat_user_name);
		setTimeout( function() { enter_room(); }, 100 );
	}
	else {
		//trace("Join socket.io chat room : room name="+$chat_room_name+", user name=" + $chat_user_name);
		chat_room_join();
	}
});

function on_keypress( selector, callback )
{
	
	$('body').on("keypress", selector, function(e) {
		if (e.which == 13) {
			e.preventDefault();
			callback();
		}
	});
}


function on_kickout()
{
	if ( i_am_room_owner == false ) return alert("ERROR : You cannot kickout user because you are not room owner.");
	var userName = $(this).parent().parent().find('[rtc_name]').attr('rtc_name');
	var re = confirm("Do you want to kick out - " + userName + " ?");
	if ( re ) {
		data = {};
		data.action = 'command';
		data.mode = 'kickout';
		data.who = userName;
		data.sender = $chat_user_name;
		easyrtc_broadcast_room( data );
	}
	else {
	}
}




/**
 *  대기실에서 방 이름을 클릭 한 경우,
 */
 
var is_observer = false;//observer

function on_room_name()
{
	
	var md5 = $(this).attr('room-md5');
	var max = get_room_max_no( md5 );
	if ( max ) {
		var uc = get_room_user_count( md5 );
		if ( uc >= max ) {
			return alert("Max no of user exceeded");
		}
	}
	

	
	var roomName = $( this ).text();
	if ( roomName == 'lobby' ) return alert( $init_opt['lang cannot enter lobby'] );
	if ( $chat_room_name != 'lobby') return alert("Please leave your room [ " + $chat_room_name + " ] before you enter another room...");
	
	if ( $(".is_observer").length ){//observer
		
	}//observer
	else{
		if ( $chat_user_name == '' ) return alert($init_opt['lang input chat user name']);
	}
	$chat_room_name = roomName;
	
	enter_room();
}

/**
 *  방 제목을 입력하고, 입장 버튼을 누른 경우
 */
 
function on_enter_room()
{			
	// check if the user is already entered a room.
	if ( $chat_room_name != 'lobby' ) return alert("Please leave the room - " + $chat_room_name);
	
	// check if the user has no name.
	if ( $chat_user_name == '' ) return alert("Please input name");
	
	
	
	// get room name in room input-box
	var roomName = $("[name='chat_room_name']").val();
	
	if ( roomName == '' ) return alert("Input room name");	
	
	if ( roomName == 'lobby' ) return alert("You cannot enter lobby");
	
	// enter room
	$chat_room_name = roomName;
	enter_room();
}
function enter_room()
{
	if ( $(".is_observer").length ){//observer
		is_observer = true;
	}//observer
	
	if ( webrtc_support == false ) return alert("Your browser does not support WebRTC. Please use Chrome.");
	
	if ( $chat_room_name != 'lobby' ) {
		$video_chat_lobby.hide();
	}
	
	//
	video_chat_start( $chat_user_name, $chat_room_name, false );
}

function on_save_user_name()
{
	//trace("save-user-name()");
	var name = $("[name='chat_user_name']").val();	
	if ( name == '' ) return alert("Please input user name");
	
	
	set_chat_user_name( name );
	
	//trace("$.cookie('chat_user_name', "+name+");");
	location.reload( true );
}
/**
 *  사용자 이름을 정한다.
 */
function set_chat_user_name( name )
{
	$.cookie('chat_user_name', name);
	$chat_user_name = name;
}




/**
 *  setRoomEnterListener 의 callback
 *  
 *  방에 입장하는 자신만 호출된다.
 *  
 */
function roomEntryListener( entered, roomName)
{
	//trace( 'I, ' + $chat_user_name + ", joined into : " + roomName);
}


/**
 *  	VIDEO CHAT starter function
 *  
 *  
 *  화상 채팅방을 연다.
 *  
 *  
 *  예제 : jQuery 의 $(function(){...}) 에서 초기화를 하기 때문에 호출도 아래와 같이
 *  
 *  $(function(){...}) 와 같이 해야 한다.
 *  
	<script>
		$(function(){
			video_chat_start( "User 1", "Test Room Name" );
		});
	</script>

 */
function video_chat_start( user_name, room_name, observer ) {
	
	/**
	 *  video_chat_start() 를 바로 호출해서 들어오는 경우를 대비해서, 변수에 이름을 기억한다.
	 */
	$chat_user_name = user_name;
	$chat_room_name = room_name;
	
	$chat_observer = observer;
	
	
	easyrtc.setUsername( $chat_user_name );
	
	create_self_video_element( );
	
	
	//trace("Initializing... room-name:" + $chat_room_name + ", user:" + $chat_user_name );
	
	
	
	easyrtc.setVideoDims( 640, 400 ); //  option1 (320, 240) pixels. This is video resolution.
	
	//
	easyrtc.initMediaSource( initMediaSuccess, initMediaFailure );
	
	
	/**
	 *  video_chat_start() 가 호출되고 리턴되기 직전에 이 콜백이 호출된다.
	 *  
	 *  용도 : 채팅방 화면 초기화 할 때 사용할 수 있다.
	 *  
	 *  버튼 표시, 채팅박스 표시 등.
	 */
	if ( typeof callback_video_chat_start == 'function' ) callback_video_chat_start( );
}

function initMediaSuccess() {
	//trace("initMediaSuccess...");
	
	
	
	
	/**
	 *  방 이름 문자열 구성 제한
	 *  
	 *  33 자 까지 가능,
	 *  가능 문자 : 영숫자, '-', '.' 가능. 그외 불가.
	 *  
	 *  실제 방 이름은 socket.io chat management 에 기록되고 화면에 표시된다.
	 *  
	 *  @note the real room name is saved in socket.io chat management.
	 */
	
	var enc = $chat_room_name;
	enc = enc.replace(/!/g, '');
	enc = encodeURIComponent(enc);
	var joinRoomName = enc.replace(/%/g, '');
	if ( joinRoomName.length > 30 ) {
		joinRoomName = joinRoomName.substr( 0, 29 );
	}
	//trace("$chat_room_name: "+ $chat_room_name + ", joinRoomName: " + joinRoomName );
	
	if( is_observer == true ){//observer
		easyrtc.enableVideo(false);
		easyrtc.enableAudio(false);
	}//observer
	
	easyrtc.joinRoom( joinRoomName ); // 같은 방에 먼저 들어가고 나서,
	easyrtc.connect( "DefaultApplicationName", connectSuccess, initMediaFailure ); // 연결을 한다.
}

/** 
 *   when your own mediea set
 *  
 *  trace("Join video chat room : room name="+$chat_room_name+", user name=" + $chat_user_name);
 */
function connectSuccess( caller_rtc_id)
{
	//trace("connectSuccess() : Entering room only for myself : ["+ $chat_room_name +"] rtc_id='"+ caller_rtc_id +"'...");	
	/**
	 *  더 이상 lobby 방은 이 함수가 호출이 되지 않는다. 하지만 안전을 위해서 둔다.
	 */
	if ( $chat_room_name == 'lobby' ) {
		return;
	}
	else {
		// socket.io 로 방설정을 먼저 하고 채팅방에 죠인해야 설정이 리턴된다. 이것은 방 목록에서 방 인원 수 표시에 영향을 미친다.
		socket_io_chat_room_setting_for_room_join();
		chat_room_join();
	}
	
	
	/**
	 *  이 콜백은 각 사용자 마다 한번씩만 발생 시킨다.
	 */
	if ( typeof callback_connect_success == 'function' ) callback_connect_success( caller_rtc_id );
	
	
	if( is_observer != true ){//observer
	
		if ( $("video[rtc-id='" + caller_rtc_id + "']").length ) {//if self video already exists.
			var selfVideo = $("video[rtc-id='"+caller_rtc_id+"']")[0];//to avoid self video duplication on server connection lost.
		}
		else {		
			var selfVideo = create_video_element( caller_rtc_id, 'me' );
		}
		
		easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream() );
		
		selfVideo.muted = true; // @todo check 'muted' attribute is added in DOM.
		
	}//observer
	/**
	 *  after join the video chat room
	 */
	$.cookie('chat_room_name', $chat_room_name); // must be needed
}


/**
 *  방에 입장 할 때, 설정한 인원수, 참여가능한 인원 목록을 서버 설정에 저장.
 *  
 *  Set users who can enter the room.
 *  
 *  @note when user lit is set, it automatically adds the room creator's name.
 *  
 */
function socket_io_chat_room_setting_for_room_join()
{
	var ul = $("[name='chat_room_user_list']").val();
	if ( ul ) {
		ul = $chat_user_name + ',' + ul;
		socket_io_chat_room_setting( $chat_room_name, 'user allow', ul);
	}
	var no = $("[name='chat_room_max_no_of_user']").val();
	if ( no ) socket_io_chat_room_setting( $chat_room_name, 'max no of user', no);
}

/**
 *  메세지를 출려하고 화상 채팅방에서 나간다.
 *  
 *  이 함수는 채팅방을 퇴장하기 전에 메세지를 출력 할 수 있다.
 */
function video_chat_room_disconnect( msg )
{
	easyrtc.disconnect();						// 방인원 초과 시, 다른 사용자와 연결이 안되게 바로 접속을 끊는다.
	alert( msg );
	video_chat_room_leave();
}



/**
 *  Room setting
 *  
 *  If setting['white-board-draw'] == 'yes', then it changes 'drawing mode'.
 *  
 */
function socket_io_chat_room_setting_whiteboard_draw( setting )
{
	//
	if ( typeof setting['white-board-draw'] == 'undefined' ) return;
	if ( setting['white-board-draw'] != 'yes' ) return;
	
	whiteboard_show_canvas();
}




/**
 *  화상방 최대 인원수 제한.
 *  
 *  인원수가 넘으면 방 입장을 하지 않고 그냥 종료한다.
 */
function socket_io_chat_room_setting_max_no_of_user( setting )
{
	if ( typeof setting == 'undefined' || typeof setting['user list'] == 'undefined' || typeof setting['max no of user'] == 'undefined' ) return;
	var ul = JSON.parse(setting['user list']);
	if ( ul.length > setting['max no of user'] ) {
		
	}
}
/**
 *  방 설정에서 사용자 목록을 콤마로 분리하여 저장한다.
 *  
 *  이 때, $chat_user_name 의 값이 기록되지 않았으면 참가를 하지 못한다.
 *  
 */
function socket_io_chat_room_setting_user_allow( setting )
{
	if ( typeof setting =='undefined' || typeof setting['user allow'] == 'undefined' ) return;
	var arr = setting['user allow'].split(',');
	if ( arr.indexOf( $chat_user_name ) == -1 ) {
		video_chat_room_disconnect( "You are not allowed to enter this room." );
	}
}



/**
 *
 * checks if the there is any available video element ( not occupid yet or closed by other user. )
 *
 * @attention before it returns the element, it marks as occupied.
 * @return null if there is no empty slot. Need to do error process.
 * 			or a video element.
 */
function create_video_element( caller_rtc_id, cls )
{
	//trace("Creating a video for " + rtc_name( caller_rtc_id ) );
	$("#video-box").append("<div class='slot " + cls + "'><video rtc_id='"+caller_rtc_id+"' rtc_name='"+rtc_name(caller_rtc_id)+"'></video><div class='video-button'><span class='name'>"+rtc_name(caller_rtc_id)+"</span><span class='kickout'>Kickout</span></div></div>");
	
	/**
	 *  
	 *  이 콜백 함수는
	 *  
	 *  내가 들어가 있는 방에
	 *  
	 *  나를 포함한, 입장하하는 사용자 마다 호출된다.
	 *  
	 *  이 함수는 callback_connect_success() 다음에 호출된다.
	 */
	if ( typeof callback_create_video_element == 'function' ) callback_create_video_element( caller_rtc_id, cls );
	return $("#video-box video[rtc_id='"+caller_rtc_id+"']")[0];
}

function rtc_name ( caller_rtc_id )
{
	return easyrtc.idToName( caller_rtc_id );
}




function initMediaFailure( errmsg ) {
	alert("initMediaFailure(): ERROR...");
	alert( errmsg );
}

/**
 *  easyrtc data stream. 
 *  
 *  For chat message and whiteboard message.
 */
function peerListener( caller_rtc_id, data )
{
	data = JSON.parse( data );
	flow("peerListener( from : " + rtc_name(caller_rtc_id) + ", data.action : " + data.action + " )" );
	//trace_object( data );
	
	if ( data.action == 'chat' ) {
		video_chat_message_recv( caller_rtc_id, data );
	}
	else if ( data.action == 'whiteboard' ) {
		whiteboard_canvas_draw_from_server( data );
	}
	else if ( data.action == 'command' ) {
		video_chat_command( caller_rtc_id, data );
	}
}

/**
 *  화상방 사용자에게 브로드캐스트
 *  
 *  자신의 제외한 방에 접속한 사용자들에게 데이터 메세지를 보낸다.
 *  
 *  
 *  예제
 *  
 *  
	data = {};
	data.action = 'whiteboard';
	data.draw = 'web';
	data.url = url;
	data.sender = $chat_user_name;
	easyrtc_broadcast_room( data );
	
	
	참고 : 서버 설정
	
 *  
 *  
 */
function easyrtc_broadcast_room( d )
{
	//trace_object("from easyrtc_broadcast_room: " + d );
	//trace("easyrtc_broadcast_room()");
	var d = JSON.stringify(d);
	for ( var b in $connected ) {
		//trace("b: " + b);
		easyrtc.sendData( b, d );
	}
}
/**
 *  화상방에 있는 사용자들에게 전자칠판 관련하여 브로드캐스팅을 한다.
 *  
 *  예제 : easyrtc_broadcast_room_whiteboard( 'open' );
 *  예제 : easyrtc_broadcast_room_whiteboard( 'width', 123 );
 */
function easyrtc_broadcast_room_whiteboard( draw, ex )
{

	data = {};
	data.action = 'whiteboard';
	data.draw = draw;
	if ( typeof ex != 'undefined' ) data.ex = ex;
	data.sender = $chat_user_name;
	easyrtc_broadcast_room( data );
}

/**
 *  returns lobby chat box tags
 *  
 *  로비 채팅 박스 태그를 추가한다.
 */
function add_chat_box_to_lobby()
{
	var $chat = $('.video-chat-lobby .chat-box');
	if ( ! $chat.length ) return;
	var box = get_lobby_chat_box();
	$chat.append( box );
}
function get_lobby_chat_box()
{
	return "<div class='chat-box'>" +
				"<div class='chat-message-wrapper'><div class='chat-message'></div></div>" +
				"<div class='chat-input'><input name='message' placeholder=' Input chat message'><span class='send'>SEND</span></div>" +
			"</div>"
}

/**
 *  자신의 화상 채팅 방을 꾸미는 태그를 추가한다.
 */
function create_self_video_element( )
{
	$video_chat_room.html("<div id='video-box'></div>");
}
/**
 *  화상 방 버튼을 추가한다.
 */
function video_chat_room_button_attach()
{
	$video_chat_room.prepend(
		"<div id='video-chat-room-button'>"+
			"<span class='camera cbutton on'>Camera</span>" +
			"<span class='sound cbutton on'>Mute</span>" +
			"<span class='leave cbutton'>Leave</span>" +
			"<span class='roomlist cbutton '>Room List</span>" +
			"<span class='whiteboard cbutton '>Whiteboard</span>" +
		"</div>"
	);
}

function video_chat_room_chat_box_attach()
{
	$video_chat_room.append(
		"<div class='chat-box'>" +
			"<div class='chat-message-wrapper'><div class='chat-message'></div></div>" +
			"<div class='chat-input'><input name='message' placeholder=' Input chat message'><span class='send'>SEND</span></div>" +
		"</div>"
	);
}





/////////////////////////	전자칠판	///////////////////////////////
var canvas_drawing_mode = 'pen';
var canvas_drawing = false;
var canvas_offset;

/* added by benjamin canvas_color var*/
var canvas_color = "black";


var canvas_drawing_position = {};



function video_chat_room_whiteboard()
{
	$whiteboard_buton_clicked = true;
	whiteboard();
	$whiteboard_buton_clicked = false;
}

/**
 *  드로우잉 함수 모음
 *  
 *  캔버스위에 마우스로 선을 그린다.
 */
function whiteboard_canvas_draw_begin( e )
{
	
	canvas_offset = $('#white-board #canvas').offset();
	var x = e.pageX - canvas_offset.left;
	var y = e.pageY - canvas_offset.top;
	
	data = {};
	data.action = 'whiteboard';
	data.sender = $chat_user_name;
	data.x = x;
	data.y = y;
	data.draw = 'begin';
	data.mode = canvas_drawing_mode;
	data.color = canvas_color;
	canvas_drawing = true;

	if ( canvas_drawing_mode == 'pen' ) {
		//canvas_context.beginPath();
	}
	else if ( canvas_drawing_mode == 'erase' ) {
		canvas_context_clearRect( data.x, data.y );
	}
	else if ( canvas_drawing_mode == 'text' ){
		var html = "<div id='white-board-menu-input-text-popup' class='white-board-button-popup' style='white-space:nowrap;position:absolute;top:"+y+"px;left:"+x+"px;z-index:2301;'>"+
		"<input style='margin:0;height:25px; padding:2px 5px 1px 5px;border:1px solid #808080; border-right:0;' type='text' name='input_text' value=''>"+
		"<span class='submit_text cbutton'>Submit Text</span>"+
		"</div>";
		whiteboard_menu_popup_show( html, '#white-board-menu-color-popup' );
	}
	
	easyrtc_broadcast_room( data );
}

function whiteboard_canvas_draw_move( e )
{	
	/*
	*added by benjamin
	*this condition is like if( mousedown == true)
	*if not added when a user mouseover on canvas and MOVES it will redraw the last sent data for some reason
	*/
	if ( canvas_drawing == false ) {
		return;
	}
	
	
	canvas_offset = $('#white-board #canvas').offset();
	var x = e.pageX - canvas_offset.left;
	var y = e.pageY - canvas_offset.top;
	
	var data = {};
	data.action = 'whiteboard';
	data.sender = $chat_user_name;
	data.x = x;
	data.y = y;
	data.draw = 'move';
	data.mode = canvas_drawing_mode;
	data.color = canvas_color;
		
	if ( canvas_drawing_mode == 'pen' ) {
		//canvas_context.lineTo( x, y );
		canvas_context_stroke( data );
	}
	else if ( canvas_drawing_mode == 'erase' ) {
		canvas_context_clearRect( x, y );
	}
	
	easyrtc_broadcast_room( data );
	
	
}

function whiteboard_canvas_draw_end( e )
{	
	canvas_drawing = false;
	canvas_erasing = false;
	data = {};
	data.action = 'whiteboard';
	data.draw = 'end';
	data.mode = canvas_drawing_mode;
	data.sender = $chat_user_name;
	
	delete canvas_drawing_position[ $chat_user_name ];
	
	easyrtc_broadcast_room( data );
}

/**
 *  전자칠판에서 메뉴를 클릭한 경우,
 *  
 *  팝업 창을 보이거나 숨긴다.
 *  
 */
function whiteboard_menu_popup_close()
{
	$('.white-board-button-popup').remove();
}
function whiteboard_menu_popup_show( html, id )
{
	if ( html == null ) {
		$('.white-board-button-popup').remove();
		return;
	}
	
	
	if ( $(id).length ) return $(id).remove();
	$('.white-board-button-popup').remove();
	$whiteboard.append( html );
	
	var menu = $('#white-board .menu');
	
	
	//trace("menu height:" + menu.height());
	var top_px = ( menu.height() + 14 ) + 'px';
	// var left_px = ( menu.position().left + 1 ) + 'px';
	var left_px = 10 + 'px';
	var width_px = ( $whiteboard.width() - 24 ) + 'px';
	
	$(id).css({
		top: top_px,
		left: left_px,
		width: width_px
	});
	
}

/**
 *  whiteboard room resize
 *  
 *  전자칠판 너비 재 조정.
 *  
 *  한 사용자가 변경하면 전체 사용자가 변경이된다.
 *  
 *  전자칠판 너비를 조정하는 방법을 다르게 하고 싶다면, 이 함수 대신 직접 만들어서 사용 할 수 있다.
 *  
 *  
 *  width 값은 본인이 직접 너비를 조정하는 경우에는 undefined 이다.
 *  
 *  그 외의 경우, 처음 방에 들어가거나 다른 사용자가 너비 수정한 경우에는 값이 들어간다.
 *  $('.on-whiteboard  #video-box')
 */
function whiteboard_resize( width )
{
	flow("whiteboard_resize( width: "+width+" )");
	var $vb = $('.on-whiteboard #video-box');
	var off = $vb.offset();
	var x = off.left + $vb.width() + 12;
	var y = off.top;
	var w;
	if ( typeof width == 'undefined' ) {
		w = $video_chat_room.width() - $('.on-whiteboard  #video-box').width();
		
		
		// 자신이 직접 전자칠판을 열거나 화면 너비를 변경을 하면, 다른 사용자들에게도 변경을 한다.
		if ( $room_init ) {
		}
		else if ( $whiteboard_buton_clicked || $window_resized ) {
			trace($chat_user_name + " : broadcasting whiteboard width " + w);
			socket_io_chat_room_setting($chat_room_name, 'white-board-width', w);
			easyrtc_broadcast_room_whiteboard( 'width', w );
		}
		
	}
	else {
		// 처음 접속시 서버로 부터 값을 받았거나, 다른 사람이 변경 한 것을 적용 하는 경우,
		w = width;
	}
	w = w - 12;
	var h = 600;
	whiteboard_rect( x, y, w, h );
	whiteboard_menu_clear();
	
	
}



/**
 *  전자칠판 메뉴에서 교재 'Open' 버튼을 클릭한 경우,
 */
function whiteboard_menu_open( e )
{
	var html = "<div id='white-board-menu-open-popup' class='white-board-button-popup'>" + 
		"<iframe id='white-board-iframe-open' src='" + url_video_chat_server + "whiteboard-book-upload.php?id=" + $chat_user_name + "' style='width:100%;'></iframe>" +
		"</div>";
	whiteboard_menu_popup_show( html, '#white-board-menu-open-popup' );
}

/**
 *  전자칠판 메뉴에서 '웹' 버튼을 클릭한 경우,
 */
function whiteboard_menu_web( e )
{
	var html = "<div id='white-board-menu-web-popup'  class='white-board-button-popup' style='position:absolute;z-index:2301; background-color: white;'>" +
		"Input URL : <input id='white-board-menu-web-open-box' name='url'><span id='white-board-menu-web-open-submit' class='cbutton'>Open</span>" +
		"</div>";
	whiteboard_menu_popup_show( html, '#white-board-menu-web-popup' );
}


/**
 *  
 *  'Draw' or 'Stop Draw' button clicked.
 *  
 *  It shows/hides canvas and buttons.
 *  
 *  Use this function to change whiteboard drawing mode.
 *  
 *  This will not only chagne drawing mode of the user but also of all the users in the room.
 *  
 *  
 *  전자칠판에서 그리기 버튼을 클릭한 경우,
 *  
 *
 */
function whiteboard_menu_draw( )
{


	data = {};
	data.action = 'whiteboard';
	
	if ( $(this).hasClass('begin') ) {
		data.draw = 'hide-canvas';
		whiteboard_hide_canvas();
		whiteboard_menu_popup_show( null,null );
		socket_io_chat_room_setting($chat_room_name, 'white-board-draw', 'no');
	}
	else {
		data.draw = 'show-canvas';
		whiteboard_show_canvas();
		socket_io_chat_room_setting($chat_room_name, 'white-board-draw', 'yes');
	}
	data.sender = $chat_user_name;
	easyrtc_broadcast_room( data );
}
/**
 *  'Draw' button clicked to draw on Canvas
 *  
 *  Use this function only to open 'drawing mode' of yourself.
 */
function whiteboard_show_canvas()
{
	$('#white-board .menu .draw').addClass('begin').text('Stop');
	$('#white-board .menu .pen').show();
	$('#white-board .menu .type').show();
	$('#white-board .menu .color').show();
	$('#white-board .menu .eraser').show();
	$('#white-board .menu .clear').show();
	$('#white-board .menu .pen').show();
	$('#white-board #canvas').show();
}
/**
 *  'Stop Draw' button clicked to stop drawing on the Canvas.
 *  
 *  Use this function only to open 'drawing mode' of yourself.
 */
function whiteboard_hide_canvas()
{
	$('#white-board .menu .draw').removeClass('begin').text('Draw');
	$('#white-board .menu .pen').hide();
	$('#white-board .menu .type').hide();
	$('#white-board .menu .color').hide();
	$('#white-board .menu .eraser').hide();
	$('#white-board .menu .clear').hide();
	$('#white-board .menu .pen').hide();
	$('#white-board #canvas').hide();
}





/**
 *  전자칠판 메뉴에서 'Color' 버튼을 클릭한 경우,
 *  
 */
function whiteboard_menu_color()
{
	var html = "<div id='white-board-menu-color-popup' class='white-board-button-popup' style='position:absolute;z-index:2301; background-color: white;'>"+
		"<span color='black'>Black</span>,"+
		"<span color='white'>White</span>,"+
		"<span color='red'>Red</span>,"+
		"<span color='green'>Green</span>,"+
		"<span color='blue'>Blue</span>,"+
		"<span color='yellow'>Yellow</span>"+
	"</div>";
	whiteboard_menu_popup_show( html, '#white-board-menu-color-popup' );
}


/**
 *  전자칠판 메뉴에서 '타입' (글쓰기) 버튼 클릭
 *  
 *  (T) type button clicked under white-board menu.
 *  
 */
function whiteboard_menu_type( e )
{
	canvas_drawing_mode = 'text';
}


function whiteboard_menu_eraser( e )
{
	canvas_drawing_mode = 'erase';
	$('#canvas').css({
		cursor: '-webkit-grab'
	});
	whiteboard_menu_popup_show( null, null );
}

/**
 *  전자칠판 메뉴에서 글 쓰기를 클릭한 경우,
 */
function whiteboard_menu_pen( e )
{
	canvas_drawing_mode = 'pen';
	$('#canvas').css({
		cursor: 'pointer'
	});
	whiteboard_menu_popup_show( null, null );
}


/**
 *  clear 'whiteboard drawing' and broadcast to clear other user's "whiteboard drawing"
 */
function whiteboard_menu_clear()
{
	whiteboard_menu_popup_show( null, null );
	canvas_context.clearRect(0, 0, $('#canvas').prop('width'), $('#canvas').prop('height'));
	
	
	//
	data = {};
	data.action = 'whiteboard';
	data.draw = 'clear';
	data.sender = $chat_user_name;
	easyrtc_broadcast_room( data );
}


//FOR INPUT_TEXT SELF AND BROADCAST
function whiteboard_input_text(e){

	//input_text
	var text_offset = $("#white-board [name='input_text']").offset();
	var x = text_offset.left - canvas_offset.left;
    var y = text_offset.top - canvas_offset.top + 4;

	var text_value = $("#white-board [name='input_text']").val();
	
	if( text_value == '' ){
		alert('input text!');
		return;
	}
	
	canvas_context.font = "bold 15px Comic Sans MS";//font style, font size, font family
	canvas_context.fillStyle = canvas_color;
	canvas_context.fillText( text_value, x, y);
	
	
	whiteboard_menu_popup_show( null, null );
	data = {};
	data.action = 'whiteboard';
	data.draw = 'begin';
	data.mode = 'submit_text';
	data.sender = $chat_user_name;
	data.text = text_value;
	data.color = canvas_color;
	data.x = x;
	data.y = y;
	easyrtc_broadcast_room( data );	
}
//INPUT_TEXT
//write input_text from listener
function add_text_data( data ){
	canvas_context.font = "bold  15px Comic Sans MS";//font style, font size, font family
	canvas_context.fillStyle = data.color;
	canvas_context.fillText( data.text, data.x, data.y);
}
/////////////////////

/**
 *  전자칠판의 iframe 에 URL 을 오픈한다.
 *  
 */
function whiteboard_iframe_open( url )
{
	$("#white-board-iframe").prop('src', url);
}
/**
 *  전자칠판의 iframe 에 연결할 URL 을 브로드캐스팅으로 같은 화상방의 사용자에게 전달한다.
 */
function whiteboard_iframe_open_broadcast(url)
{
	whiteboard_menu_popup_show( null, null );
	data = {};
	data.action = 'whiteboard';
	data.draw = 'web';
	data.url = url;
	data.sender = $chat_user_name;
	easyrtc_broadcast_room( data );
	
	/**
	 *  마지막은 연 페이지를 서버에 저장한다.
	 */
	socket_io_chat_room_setting($chat_room_name, 'white-board-iframe-url', url);
}

/**
 *  서버에 설정을 저장한다.
 */
function socket_io_chat_room_setting(room, key, value)
{
	var data = {};
	data.action = 'setting';
	data.room = room;
	data.key = key;
	data.value = value;
	socket_io_chat_send( data );
}
	
/**
 * 전자칠판을 스크롤 한다.
 */
function whiteboard_iframe_scroll_broadcast( top )
{
	var data = {};
	data.action = 'whiteboard';
	data.draw = 'scroll';
	data.top = top;
	data.sender = $chat_user_name;
	easyrtc_broadcast_room( data );
	//trace("whiteboard_iframe_scroll_broadcast() : page-scroll:" + top);
	//trace_object(data);
	
	
	/**
	 *  전자칠판의 마지막 스크롤을 서버 설정에 저장한다.
	 */
	socket_io_chat_room_setting($chat_room_name, 'white-board-iframe-top', top);
	
}


	

function on_click_white_board_menu_ebook()
{
	whiteboard_iframe_open( '//ontue.com/~genbook/' );
	whiteboard_iframe_open_broadcast( '//ontue.com/~genbook/' );
}


/** @deprecated : HTTPS 로 접속하는 경우, HTTP 로 접속을 못하므로 더이상 웹 공유를 사용하지 않는다.
 *  
 *  
 *  전자칠판 메뉴의 '웹' 오픈 박스에서 'URL' 을 입력하고 '전송' 버튼을 클릭한 경우,
 *  
 */
/**
 *  
function whiteboard_menu_web_popup_submit()
{
	var url = $("#white-board-menu-web-open-box").val();
	if ( url == '' ) {
		alert("Please input website address");
		return;
	}
	trace("whiteboard_menu_web_popup_submit() : " +url);
	whiteboard_iframe_open( url );
	whiteboard_iframe_open_broadcast( url );
}
*/

function whiteboard_menu_color_popup_submit(){
	canvas_color = $(this).attr("color");
	whiteboard_menu_popup_close();
}
/*added by benjamin*/
var line_to_x = new Array();
var line_to_y = new Array();
var current_color = new Array();//<- not working
/*---------------------*/
function canvas_context_stroke( data )
{
	canvas_context.beginPath();//has to be here for unique colors 
	//it has to begin everytime a stroke is done or else the color difference will be shared to all
	
	current_color[data.sender] = data.color;	
		
	canvas_context.lineJoin = "round";
	canvas_context.lineWidth = 3;
	/*added by benjamin*/
	line_to_x[ data.sender ] = data.x;
	line_to_y[ data.sender ] = data.y;
	/*------------*/
	if ( typeof canvas_drawing_position[ data.sender ] == 'undefined' ) {
		canvas_drawing_position[ data.sender ] = { x: data.x, y:data.y };
		var x = data.x;
		var y = data.y;
	}
	else {
		var x = canvas_drawing_position[ data.sender ].x;
		var y = canvas_drawing_position[ data.sender ].y;
	}	
	
	canvas_context.moveTo( x, y );
	canvas_context.lineTo(line_to_x[ data.sender ],line_to_y[ data.sender ]);//moved from if ( data.mode == 'pen' ) {...}
	canvas_context.strokeStyle = current_color[data.sender];
	
	canvas_context.stroke();
	
	canvas_drawing_position[ data.sender ].x = data.x;
	canvas_drawing_position[ data.sender ].y = data.y;
	
}
function canvas_context_clearRect( x, y )
{
	canvas_context.clearRect( x - 12, y - 12, 20, 20 );
}

/**
 *  전자칠판에 관련한 동기화 메세지를 서버로 부터 받은 경우,
 *  
 *  
 *  
 */
function whiteboard_canvas_draw_from_server( data )
{
	flow("whiteboard_canvas_draw_from_server( data.draw : "+data.draw+" )");
	if ( data.sender == $chat_user_name ) {	// easyrtc room broadcast 에서 자신은 제외되지만, 혹시나
		return;
	}
	
	if ( data.draw == 'begin' ) {
		if ( data.mode == 'pen' ) {
			//canvas_context.beginPath();
		}
		else if ( data.mode == 'erase' ) {
			canvas_context_clearRect( data.x, data.y );
		}
		else if ( data.mode == 'submit_text' ) {
			add_text_data( data );
		}
	}
	else if ( data.draw == 'move' ) {
		if ( data.mode == 'pen' ) {			
			canvas_context_stroke( data );
		}
		else if ( data.mode == 'erase' ) {
			canvas_context.clearRect( data.x - 12, data.y-12, 20, 20 );
		}
	}	
	else if ( data.draw == 'end' ) {
		delete canvas_drawing_position[ data.sender ];
	}
	else if ( data.draw == 'clear' ) {
		canvas_context.clearRect(0, 0, $('#canvas').prop('width'), $('#canvas').prop('height'));
	}
	else if ( data.draw == 'web' ) {
		whiteboard_iframe_open( data.url );
	}
	else if ( data.draw == 'hide-canvas' ) {
		whiteboard_hide_canvas();
	}
	else if ( data.draw == 'show-canvas' ) {
		whiteboard_show_canvas();
	}
	else if ( data.draw == 'scroll' ) {
		whiteboard_iframe_scroll( data.top, 20 );
	}
	else if ( data.draw == 'open' ) {
		whiteboard_open();
	}
	else if ( data.draw == 'close' ) {
		whiteboard_close();
	}
	else if ( data.draw == 'width' ) {
		whiteboard_resize( data.ex );
	}
	
}
/**
 *  전자칠판 안에 있는 자식 iframe 에 메세지를 전송하여 스크롤을 한다.
 *  
 *  timeout 에는 setTimeout 의 timeout 값을 넣는다.
 *  
 *  맨 처음 접속하는 경우, 즉, 서버에서 방의 전자칠판 iframe URL 을 받은 경우에는,
 *  
 *  웹 페이지를 로드해야하므로 시간 차이를 좀 두는 것이 좋다.
 *  
 */
function whiteboard_iframe_scroll( top, timeout )
{
	//trace("scroll:"+top);
	var o = document.querySelector('#white-board-iframe');
	if ( o ) {
		setTimeout(function(){
			var sd = { 'code' : 'scroll', 'top' : top };
				o.contentWindow.postMessage( sd, '*');
			},
		timeout);
	}
}



/**
 *  전자칠판을 열거나 닫는다.
 */
function whiteboard()
{
	$wr = $('#white-board-wrapper');
	if ( $wr.length ) whiteboard_close( true );
	else whiteboard_open( true );
}
function whiteboard_open( broadcast )
{
	flow( "whiteboard_open( broadcast: " + broadcast + " )" );
	var html = "<div id='white-board-wrapper'><div id='white-board'>" +
		"<div class='menu'><span class='open cbutton'>Open</span><span class='ebook cbutton'>eBook</span><!--span class='web cbutton'>Web</span--><span class='draw cbutton'>Draw</span><span class='pen cbutton'>Pen</span><span class='type cbutton'>Type</span><span class='color cbutton'>Color</span><span class='eraser cbutton'>Eraser</span><span class='clear cbutton'>Clear</span></div>"+
		"<iframe id='white-board-iframe' src='" + url_whiteboard + "'></iframe><canvas id='canvas'></canvas>" +
		"</div></div>";
	$video_chat_room.append( html );
	
	$whiteboard = $( "#white-board");
	
	if( is_observer == true ){//observer
		$whiteboard.append("<div style='position:absolute;top:0;left:0; opacity:0; z-index:2300; height:800px; width:600px;'></div>");		
	}//observer
	
	canvas_context = $('#canvas').get(0).getContext('2d');
	
	
	
	/**
	 *  서버로 부터 명령을 받은 경우, 브로드캐스트 하지 않는다.
	 */
	if ( typeof broadcast == 'undefined' || broadcast != true ) {
		
	}
	/**
	 *  서버로 부터 명령을 받은 경우가 아니라 직접 자신이 오픈하는 경우,
	 */
	else {
		easyrtc_broadcast_room_whiteboard( 'open' );
		socket_io_chat_room_setting( $chat_room_name, 'whiteboard', 'open');
		whiteboard_iframe_open_broadcast( url_whiteboard );
	}
	
	/**
	 *  전자칠판 열기 콜백
	 *  
	 *  전자칠판을 열고 초기화를 할 때 사용 할 수 있다.
	 *  
	 *  @note The code below must come after broad casting 'whiteboard open'
	 */
	if ( typeof callback_whiteboard_open == 'function' ) {
		flow(" calling callback_whiteboard_open();");
		callback_whiteboard_open();
	}
	
}
/**
 *  전자칠판을 닫는다.
 */
function whiteboard_close( broadcast )
{
	$wr = $('#white-board-wrapper');
	$wr.remove();
	/**
	 *  전자칠판을 닫을 때 사용하는 콜백.
	 *  
	 *  먼저 전자칠판을 없애고 콜백을 호출한다.
	 */
	if ( typeof callback_whiteboard_close == 'function' ) callback_whiteboard_close( );
	
	
	/**
	 *  서버로 부터 명령을 받은 경우, 브로드캐스트 하지 않는다.
	 */
	if ( typeof broadcast == 'undefined' ) {
		return;
	}
	/**
	 *  자신이 직접 전자칠판을 닫은 경우,
	 */
	else {
		whiteboard_iframe_open_broadcast( url_whiteboard );
		easyrtc_broadcast_room_whiteboard( 'close' );
		socket_io_chat_room_setting( $chat_room_name, 'whiteboard', 'close');
	}
}
/**
 *  전자칠판의 위치를 지정한다.
 */
function whiteboard_rect( x, y, width, height )
{
	$wr = $('#white-board-wrapper');
	$wr.css({
		'left': x + 'px',
		'top': y + 'px',
		'width': width + 'px',
		'height': height +'px'
	});
	$('#white-board #canvas, #white-board-iframe').prop('width', width).prop('height', height);
}




/////////////////////////////////////////////////////////// 전자칠판 끝


/**
 *  화상룸의 명령을 서버로 부터 받은 경우,
 */
function video_chat_command( rtc_caller_id, data ) {

	if ( data.sender == $chat_user_name ) {	// easyrtc room broadcast 에서 자신은 제외되지만, 혹시나
		return;
	}
	
	if ( data.mode == 'kickout' ) {
		if ( data.who == $chat_user_name ) {
			video_chat_room_disconnect( "You are kicked out by - " + data.sender );
		}
	}
}








function video_chat_room_button_toggle_status( $this )
{
	if ( $this.hasClass("on") ) {
		$this.removeClass("on").addClass("off");
		return false;
	}
	else {
		$this.removeClass("off").addClass("on");
		return true;
	}
}

function video_chat_room_camera()
{
	var status = video_chat_room_button_toggle_status( $(this) );
	var vidtracks = easyrtc.getLocalStream().getVideoTracks();
	if ( vidtracks ) {
		for (var i = 0; i < vidtracks.length; i++) {
			var vidtrack = vidtracks[i];
			vidtrack.enabled = status;
		}
	}
}

function video_chat_room_sound()
{
	var status = video_chat_room_button_toggle_status( $(this) );
	var mictracks = easyrtc.getLocalStream().getAudioTracks();
	if (mictracks) {
		for (var i = 0; i < mictracks.length; i++) {
			var mictrack = mictracks[i];
			mictrack.enabled = status;
		}
	}
}

/**
 *  화상방을 퇴장한다.
 *  
 *  화상방을 퇴장하기 위해서는 항상 이 함수를 호출해야한다.
 *  
 *  단, 퇴장 직전에 메세지를 화면에 출력을 하고 싶다면, 아래의 함수를 사용 할 수 있다.
 *  
 *  video_chat_room_disconnect( "You are kicked out by - " + data.sender );
 */
function video_chat_room_leave()
{
	$.cookie('chat_room_name', 'lobby' );
	var url = './';
	if ( typeof $init_opt['url leave'] != 'undefined' ) url = $init_opt['url leave'];
	location.href = url;
}

function video_chat_room_roomlist()
{
	$video_chat_lobby.toggle();
	if ( typeof callback_video_chat_room_roomlist == 'function' ) callback_video_chat_room_roomlist();
}


function video_chat_message_send( )
{
	var $input = $("#video-chat-room .chat-input [name='message']");
	var text = $input.val();
	if ( text == '' ) {
		//trace('empty chat message');
		return false;
	}
	text = text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); //to avoid php and js scripts on chatbox
	
	var data = {};
	data.action = 'chat';
	data.name = $chat_user_name;
	data.message = text;
	
	
	//trace("video_chat_message_send():");
	
	
	easyrtc_broadcast_room( data );
	$input.val('');
	video_chat_message_recv( easyrtc.myEasyrtcid, data );
}
function socket_io_chat_send_message()
{

	var text = $lobby_chat_input.val();
	if ( text == '' ) return;
	text = text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); //to avoid php and js scripts on chatbox

	var data = {};
	data['action'] = 'message';
	data['id'] = get_user_name();
	data['message'] = text;
	socket_io_chat_send(data);
	$lobby_chat_input.val('');
	// socket_io_chat_recv_message( data );
}
/**
 *  대기실 채팅 메세지 수신
 */
function socket_io_chat_recv_message( data )
{
	var rtc_id = easyrtc.myEasyrtcid;
	var name = data.id;
	var message = data.message;
	var cls;
	if ( name == $chat_user_name ) cls = 'you';
	else cls = 'other';
	
	var $box = $lobby_chat_display;
	if ( cls == 'you' ) $box.append("<div class='chat-message-line " + cls + "' rtc_id='"+rtc_id+"'><span name='message'>" + message + "</span><span class='separator'>:</span><span class='name'>you</span></div>");
	else $box.append("<div class='chat-message-line " + cls + "' rtc_id='"+rtc_id+"'><span class='name'>"+name+"</span><span class='separator'>:</span><span name='message'>" + message + "</span></div>");
	$box.animate( { scrollTop: $box.prop("scrollHeight") - $box.height() }, 150);
}


/**
 *  화상방 채팅 메세지 수신
 *  
 *  chat message received inside video-chat-room
 */
function video_chat_message_recv( rtc_id, data  )
{
	var name = data.name;
	var message = data.message;
	var cls;
	if ( name == $chat_user_name ) cls = 'you';
	else cls = 'other';
	
	var $box = $("#video-chat-room .chat-message");
	if ( cls == 'you' ) $box.append("<div class='chat-message-line " + cls + "' rtc_id='"+rtc_id+"'><span name='message'>" + message + "</span><span class='separator'>:</span><span class='name'>you</span></div>");
	else $box.append("<div class='chat-message-line " + cls + "' rtc_id='"+rtc_id+"'><span class='name'>"+name+"</span><span class='separator'>:</span><span name='message'>" + message + "</span></div>");
	$box.animate( { scrollTop: $box.prop("scrollHeight") - $box.height() }, 150);
}



/**
 *  방에서 누가 들어오거나 나갈 때, 이 함수가 호출 된다.
 */
/**
 *  @note from Mr. Song
 *  
 *  @todo dobule-check
 *  
 *  Flagging 'is_still_calling' mechanism may be theoretically wrong.
 *  
 *  roomOcuupantListener is a place where you can get new users or leaving users.
 *  
 *  if the idea is like 'Not to performCall() twice to those who I already performed calling',
 *  
 *  then the setting for 'is_still_calling to false' must be somewhere else since it is non-blocking procedure.
 *  
 *  
 */
//added var by benjamin - still not fully tested.
//var is_still_calling = false;
/*--------------*/
function roomOccupantListener(roomName, otherPeers, myInfo)
{
	/*new*/
	//if ( is_still_calling == true ) return;
	//is_still_calling = true;
	//eo

	//trace("roomOccupantListener(" + roomName + ", ... )");
	//trace_object(otherPeers);
	
	var old_rtc_ids = new Array();
	if ( $connected.length != 0 ) {
		for(  rtc_id in $connected ){
			old_rtc_ids.push( rtc_id );
		}
	}
	
	
	$connected = otherPeers;
	
	//trace("There are (" + $connected.length + ") users");
	
	var id;
	i_am_room_owner = true;
	for ( id in otherPeers ) {
		if ( myInfo.roomJoinTime > otherPeers[id].roomJoinTime ) {
			i_am_room_owner = false;
		}
		 
		if( old_rtc_ids.length != 0 ){
			if( old_rtc_ids.indexOf( id ) == "-1" ){
				performCall( id );
			}
		}
		else{
			performCall( id );
		}
	}
	
	if ( i_am_room_owner ) {
		$('.slot.me').addClass('room-owner');
	}
	else {
		$('.slot.me').removeClass('room-owner');
	}
	
	
	/*new*/
	//is_still_calling = false;
	/**************/
}

function performCall(easyrtcid) {
	//trace("performCall(" + rtc_name( easyrtcid ) + ")");
	easyrtc.call(
		easyrtcid,
		function(easyrtcid) { trace("completed call to " + easyrtcid);},
		function(errorMessage) { trace("performCall() callback -> errorMessage() :" + errorMessage);},
		function(accepted, bywho) {
			trace((accepted?"accepted":"rejected")+ " by " + bywho);
		}
	);
}


	/** @short this reads stream from outsite
	 *
	 * @note this callback is being called every time a user login and initialize their video or when a user gets out of the room.
	 */
function streamAcceptor( caller_rtc_id, stream )
{
	var video = create_video_element( caller_rtc_id, 'other' );
	
	// @todo find it the best volume.
	video.volume = 0.8;

	if( video == null) { //just don't call if null
		// @todo try to set the stream awhile later.
		return alert( 'NO_VIDEO_SLOT_AVAILABLE' );
	}
	else {
		easyrtc.setVideoObjectSrc( video, stream );
		//trace("streamAcceptor() : some body comes in : " + rtc_name(caller_rtc_id) );
	}
}
/**
 *  
 */
function streamClosed( caller_rtc_id ) {
	//trace( 'streamClosed() : ' + caller_rtc_id + " has closed his/her stream...");
	//trace("Removing video element for : " + caller_rtc_id );
	video_chat_room_delete_video( caller_rtc_id );
	
}
function video_chat_room_delete_video( id )
{	
	$("#video-box video[rtc_id='" + id + "']").parent().remove();
}
function streamChecker( caller_rtc_id, acceptor )
{
}
	

/**
 *  서버의 socket.io 채팅방 관리 기능.
 *  
 *  
 *  
 */
function socket_io_chat_data_from_server( data )
{
	flow("socket_io_chat_data_from_server(data) : data.action = " + data.action);
	//trace_object(data);
	
	
	/** 개설된 대화방 목록 표시 */
	if ( data.action == 'room list' ) {
		rooms = JSON.parse(data.value);
		
		$('.room-list').html('');
		
		for ( var x in rooms ) {
			room_list_room_add( rooms[x] );
		}
		chat_user_list_all();
	}
	
	
	else if ( data.action == 'join' ) {
	
		var md5 = data.md5;
		var sid = data.sid;
		var id = data.id;
		var room = data.room;
		
		
		room_list_room_user_delete( sid );	
		room_list_room_add( data );
		room_list_room_user_add( md5, id, sid );
		room_list_room_user_count( md5, 1 );
		
	}
	
	else if ( data.action == 'disconnect' ) {
		var md5 = data.md5;
		var sid = data.sid;
		room_list_room_user_count( md5, -1 );
		room_list_room_user_delete( sid );
	}
	
	
	/** 사용자 목록 */
	else if ( data.action == 'user list' ) {
		
		var users = JSON.parse(data.users);
		var len = users.length;
		//trace("No. of Users: " + len);
		if ( len ) {
			for ( var i in users ) {
				var u = users[i];
				room_list_room_user_add( u.md5, u.id, u.sid );
				room_list_room_user_count( u.md5, +1 );
			}
		}
		
	}
	
	/** 대기실 로비 채팅 */
	else if ( data.action == 'message' ) {
		socket_io_chat_recv_message( data );
	}
	
	/** 
	 *  
	 *  Room settings from server. It is called only one time when the user enters into a room.
	 *  
	 *  처음 화상방에 들어 갈 때, 서버로 부터 해당 화상방의 설정을 받는다.
	 *  
	 *  
	 *  입장 할 때 한번 만 설정을 받는다.
	 *  
	 *  
	 *	서버 설정을 받으면 설정 초기화를 한다.
	 *  
	 *  인원수 제한, 허가된 사용자 목록 등의 확인도 한다.
	 *  
	 */
	else if ( data.action == 'setting' ) {
		flow("data.action == setting");
		$room_init = true;
	
		//trace("socket_io_chat_recv() : room setting received from server");
		//trace_object( data.setting );
		
		$room_setting = data.setting;
		
		socket_io_chat_room_setting_max_no_of_user( data.setting );
		socket_io_chat_room_setting_user_allow( data.setting );
		
		
		// 전자칠판 열기
		if ( typeof data.setting['whiteboard'] != 'undefined' ) {
			if ( data.setting['whiteboard'] == 'open' ) {
				whiteboard_open();
		
				// 전자칠판 iframe URL 열기
				if ( typeof data.setting['white-board-iframe-url'] != 'undefined' ) {
					// 서버에서 열 페이지를 받은 경우, 자기만 열고 브로드 캐스팅은 하지 않는다.
					//whiteboard_iframe_open_broadcast();
					whiteboard_iframe_open( data.setting['white-board-iframe-url'] );
					
					if ( typeof data.setting['white-board-iframe-top'] != 'undefined' ) {
						whiteboard_iframe_scroll( data.setting['white-board-iframe-top'], 1500 );
					}
				}
				
				// This code must be stated after opening white-board
				socket_io_chat_room_setting_whiteboard_draw( data.setting );
				if ( typeof $room_setting['white-board-width'] != 'undefined' ) {
					flow("calling whiteboard_resize()");
					whiteboard_resize($room_setting['white-board-width']);
				}
			}
		}
		
		
		$room_init = false;
	}
	
}


/**
 *  대기실 방 목록에 방을 추가한다.
 *  
 *  방이 이미 만들어져 있으면, 방 설정을 변경하고 리턴한다.
 */
function room_list_room_add( room )
{
	$room = $("[room-md5='"+room.md5+"']");
	
	
	if ( $room.length ) {		// 방이 이미 존재하는가?
		// 그렇다면 필요한 설정을 하고 리턴한다.
		return;
	}
	var max_no;
	if ( typeof room.max_no_of_user == 'undefined' ) max_no = '';
	else max_no = room.max_no_of_user;
	html = "<div class='room'><span class='room-name' room-md5='"+room.md5+"'>" + room.room + "</span><span class='user-count'></span><span class='max-no-of-user'>"+max_no+"</span><span class='room-user'></span></div>";
	$('.room-list').append(html);
}
/**
 *  대기실 방 목록에 사용자를 삭제한다.
 */
function room_list_room_user_delete( sid )
{
	$user = $("[sid='"+sid+"']");
	if ( $user.length ) {							// 사용자가 있는가?
		var md5 = get_room_md5_of_user( sid );		// 그렇다면 사용자 방 md5
		$user.remove();								// 사용자 삭제
		var cnt = room_list_room_user_count( md5, -1 );		// 사용자 방 인원수 -1
		if ( cnt <= 0 ) {							// 방 인원이 없으면,
			room_delete( md5 );						// 방 삭제
		}
	}
}
function get_room_md5_of_user( sid )
{
	$user = $("[sid='"+sid+"']");
	var md5 = $user.parent().parent().find('.room-name').attr('room-md5');
	//trace("get_room_md5_of_user( "+sid+" ) : " + md5);
	return md5;
}

function room_delete( md5 )
{
	$("[room-md5='"+md5+"']").parent().remove();
}

/**
 *  사용자를 방 목록에 추가한다.
 */
function room_list_room_user_add( md5, id, sid ) {
	if ( id == '' ) id = $init_opt['lang guest'];
	var html = "<span class='user' sid='"+sid+"'>" + id + "</span>";
	//trace(html);
	$("[room-md5='"+md5+"']").parent().children('.room-user').append(html);
}
/**
 *  대기실 방목록에서 사용자 수를 지정한다.
 */
function room_list_room_user_count( md5, n )
{
	x = get_room_user_count( md5 );
	var r = x + n;
	$("[room-md5='"+md5+"']").parent().children('.user-count').text( r );
	return r;
}


/**
 *  대기실의 방 목록에서 한 방의 현재 사용자 수를 리턴한다.
 *  
 *  returns the number of users of a room.
 */
function get_room_user_count( md5 )
{
	$obj = $("[room-md5='"+md5+"']").parent().children('.user-count');
	var x = $obj.text();
	x = parseInt(x) || 0;
	//trace("get_room_user_count( " + md5 + " ) : " + x );
	return x;
}
/**
 *  대기실의 방 목록에서 특정 방의 최대 제한 사용자 수를 리턴한다.
 */
function get_room_max_no( md5 )
{
	$obj = $("[room-md5='"+md5+"']").parent().children('.max-no-of-user');
	var x = $obj.text();
	x = parseInt(x) || 0;
	//trace("get_room_max_no( " + md5 + " ) : " + x );
	return x;
}




function get_user_name()
{
	return $chat_user_name;
}

function get_chat_room_name()
{
	return $chat_room_name;
}


function socket_io_chat_send(data)
{
	//trace('Chat Send: ');
	//trace_object(data);
	chat_socket.emit('chat', data);
}



function socket_connect ()
{
	//trace("Connected successfully...");
	
	video_chat_lobby();
}
function socket_connecting () {
	trace("Trying to connect...");
}
function socket_disconnect() {
	trace("Disconnected....");
}
function socket_connect_failed() {
	trace("Connection failed...");
}
function socket_error() {
	trace("Error...!");
}
function socket_reconnect_failed() {
	trace("Reconnection failed...");
}

function sooket_reconnect() {
	trace("Reconnection succefully...");
}

function socket_reconnecting() {
	trace("Reconnecting....");
}


/////////////
function trace(str)
{
	trace_count ++;
	if ( typeof console === "undefined" || typeof console.log === "undefined" ) { }
	else console.log("TRACE[" + trace_count + "] : " + str);
}
function flow(str)
{
	trace( ' => ' + str);
}
function trace_object(data)
{
	console.log(data);
}

function chat_room_list()
{
	var msg = {};
	msg['action'] = 'room list';
	msg['id'] = get_user_name();
	socket_io_chat_send(msg);
}

function chat_user_list()
{
	var msg = {};
	msg['action'] = 'user list';
	msg['id'] = get_user_name();
	socket_io_chat_send(msg);
}

function chat_user_list_all()
{
	var msg = {};
	msg['action'] = 'user list';
	msg['id'] = get_user_name();
	msg['value'] = '';
	socket_io_chat_send(msg);
}

function chat_room_join()
{
	var msg = {};
	msg['action'] = 'join';
	msg['id'] = get_user_name();
	msg['room'] = get_chat_room_name();
	socket_io_chat_send(msg);
}

function chat_room_join_lobby()
{
	var msg = {};
	msg['action'] = 'join';
	msg['id'] = get_user_name();
	msg['room'] = 'lobby';
	socket_io_chat_send(msg);
}





/**
 *  For simplicity, it does not update. it refreshes for every 8 seconds.
 */
function video_chat_lobby()
{
	//trace("video_chat_lobby()");
	if ( $('.room-list').length ) {
		chat_room_list();
	}
}











///////////////////////////////////			jQuery cookie
/*!
 * jQuery Cookie Plugin v1.4.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2006, 2014 Klaus Hartl
 * Released under the MIT license
 */
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	var pluses = /\+/g;

	function encode(s) {
		return config.raw ? s : encodeURIComponent(s);
	}

	function decode(s) {
		return config.raw ? s : decodeURIComponent(s);
	}

	function stringifyCookieValue(value) {
		return encode(config.json ? JSON.stringify(value) : String(value));
	}

	function parseCookieValue(s) {
		if (s.indexOf('"') === 0) {
			// This is a quoted cookie as according to RFC2068, unescape...
			s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		}

		try {
			// Replace server-side written pluses with spaces.
			// If we can't decode the cookie, ignore it, it's unusable.
			// If we can't parse the cookie, ignore it, it's unusable.
			s = decodeURIComponent(s.replace(pluses, ' '));
			return config.json ? JSON.parse(s) : s;
		} catch(e) {}
	}

	function read(s, converter) {
		var value = config.raw ? s : parseCookieValue(s);
		return $.isFunction(converter) ? converter(value) : value;
	}

	var config = $.cookie = function (key, value, options) {

		// Write

		if (arguments.length > 1 && !$.isFunction(value)) {
			options = $.extend({}, config.defaults, options);

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setTime(+t + days * 864e+5);
			}

			return (document.cookie = [
				encode(key), '=', stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// Read

		var result = key ? undefined : {};

		// To prevent the for loop in the first place assign an empty array
		// in case there are no cookies at all. Also prevents odd result when
		// calling $.cookie().
		var cookies = document.cookie ? document.cookie.split('; ') : [];

		for (var i = 0, l = cookies.length; i < l; i++) {
			var parts = cookies[i].split('=');
			var name = decode(parts.shift());
			var cookie = parts.join('=');

			if (key && key === name) {
				// If second argument (value) is a function it's a converter...
				result = read(cookie, value);
				break;
			}

			// Prevent storing a cookie that we couldn't decode.
			if (!key && (cookie = read(cookie)) !== undefined) {
				result[name] = cookie;
			}
		}

		return result;
	};

	config.defaults = {};

	$.removeCookie = function (key, options) {
		if ($.cookie(key) === undefined) {
			return false;
		}

		// Must not alter options, thus extending a fresh object...
		$.cookie(key, '', $.extend({}, options, { expires: -1 }));
		return !$.cookie(key);
	};

}));
