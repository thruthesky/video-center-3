# Video Center 3

Video Conference System By Withcenter, Inc.


# TODO

* 사용자 이름 A, B, C 가 있는 경우,

    A 가 오픈을 하면 sessionid 는 아래와 같이 연결 된다.

    A => B, C
    B => A, C
    C => A, B

    와 같이 개별 연결을 한다.

    즉, sessionid 와는 상관이 없이 연결이된다???

    이 상태에서 A 가 빠지면

    B => C
    C => B

    가 남게 된다.

    이 상태에서 다시 A 가 들어와도 서로를 연결 할 수 없다.

    Signaling 서버가 죽으면 모든 정보가 다 사라진다.



    이런 과정이 반복되고, ... Signaling 에서는 어떤 아이디가 어떤 건지 헷갈리고....

    그래서 0.0.6 을 정리하고, 완전한 채팅방 기능을 만들어도 연결 힘들다.

일단 대충 사용한다.





# 문서화

아래와 같이 하면, extra 정보가 모든 사용자 들간에 공유가 된다. connection.updateExtraData() 를 호출하고 접속을 해야 하는가? 접속하고 나서 해도 되는가?

        connection.extra.socket_id = socket.id;
        connection.extra.username = username;
        connection.updateExtraData();
        connection.openOrJoin( roomname );




* Video Stop ( Pause )
    * Mute 를 하면 소리는 동작을 하는 것 같다.
    * 하지만 Video Pause 의 경우,
        * 본인의 컴퓨터에서만 동작을 하지 않을 뿐 상대 컴퓨터에서는 보인다.
        * 이것은 Video 태그의 속성으로 Play 를 멈추면 자기만 보지 않는 것이며,
            * 여전히 video 녹음은 상대방에게 전송이 되는 것이다.
            * 즉, Video 태그는 play 만 멈출 뿐, 카메라의 녹음을 멈추거나 전송을 멈추지 않는 것이다.
        * 해결책으로는 Mute 버튼을 클릭하면 상대편의 컴퓨터에서 자신의 Video 가 안보이게 멈추거나 video element 를 hide 한다.

* 한 브라우저 당 하나의 웹캠인 경우,
    * 웹캠을 켜지 않고, 다른 방에 들어 갈 수 있는가?
    * 예) 참관 모드로 동시에 10개의 방에 들어 감.




# 참고

## SSL 필수

* 웹브라우저가 접속하는 scheme 이 SSL 이 아니면 getUserMedia() 를 사용 할 수 없다.

## socket.io 에서 ERR_EMPTY_RESPONSE

* SSL 이 아닌 상태에서 Join Room 을 할 때, socket.io 에러가 발생한다.


## Signaling Server ( node server ) 가 죽으면

1. socket.io connection is closed 가 발생하고
2. socket.io reconnecting 상태로 되며
3. 약 1초에 한번씩 Singaling Server 로 재 접속을 시도한다.
4. 재 접속되면, socket.io connection is opened 상태가 된다.


## 크롬(카나리 포함)에서 한 컴퓨터에서 하나의 웹 캠만 사용 가능

* 한 컴퓨터에 웹 캠이 하나 뿐인데,
* 두개의 웹브라우저(또는 창, 탭)에서 하나의 웹 캠을 공유 할 수 없다.
* 한 개의 웹브라우저 당 하나의 캠만 사용 가능하다.

## video 태그

* video 태그의 속성으로 controls 를 주면, 비디오에 컨틀롤러가 나타나는데 불편하다.
* 전체 화면 보기가 가능하고 여러가지 편리해 보이지만,
* 비디오와 음성 녹음이 계속 되고 전달되므로 올바르게 동작하지 않는다.


# 문서화 할 것.

onstream 의 event.mediaElement 에서 video element 의 controls 를 없애려면
아래와 같이

$(event.mediaElement).prop('controls', false) 와 같이 하면 된다.

$(event.mediaElement) 와 같이 jQuery 객체를 만들어서 활용을 할 수 있다.


    connection.onstream = function(event) {
        var video = event.mediaElement;
        var $v = $(video);
        console.log($v.prop('id'));
        console.log($v.prop('src'));
        $v.prop('controls', false);
        $('body').append($v);
    };