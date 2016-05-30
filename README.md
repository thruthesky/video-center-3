# Video Center 3

Video Conference System By Withcenter, Inc.


# TODO

* 동시에 두명이 그리는 것.
* 방의 그림 정보를 방에 저장한다. 그래서 방이 파괴되면 자동으로 파괴되도록 한다.
* canvas 가 resize 되면 모든 그림 정보를 초기화 하는가? 그렇다면 서버로 부터 다시 값을 불러와서 그려야 한다.
* 교재는 모두 https 상에 있어야 한다.
    * 교재는 모두 이미지로 한다.
    * 홈페이지는 rwd 라서 전자칠판을 사용 할 수 없으므로
        - 모든 교재용 정보(홈페이지 등)는 JPG 으로 저장한다.



* 모바일에서 일대일 통화인경우 자동으로 Metro 로 되도록 한다.

* 일대일의 통화인 경우,

    비디오 overlay 에서 상대방이 크게 나오게한다.

* 접속하면 자동으로 chat-join-lobby 방에 들어가면 자동으로 chat-leave-lobby 를 둘 것.
    * lobby 에서 채팅을 하면 lobby 에 있는 사람들끼리만 보인다.
* chat 프로토콜을 unit testing 할 것.

* 이름이 없으면 빨간색 X, 이름을 업데이트하면 gif loader, 이름이 업데이트 되면, 초록색 OK 체크.



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


# 명령

## 채팅 명령이다.

socket.emit('roomname-list', function(r) { console.log(r); }); // 모든 방 이름만 배열로 추출. 사용자 정보 없음.
socket.emit('chat-room-list', function(r) { console.log(r); }); // 모든 방 정보 객체로 추출. 사용자 정보가 들어가 있음.
socket.emit('room-info', 'Room huh', function(r) { console.log(r); }); // 방 이름을 전달하면, 해당 방의 사용자 목록을 객체(배열)로 리턴한다.
socket.emit('chat-user-list', function(r) { console.log(r); }); // 모든 사용자정보를 추출 한다.


# 화상방

모바일과 데스크톱 디자인의 break-ponit 는 546 이다.

모든 디자인을 여기에 맞추어야 한다.


# 전자칠판

* 화상방에 전자칠판이 보여지면, #room.has-whiteboard 상태가 된다.

* canvas 너비를 100% 로 지정한다. 그래서 완전한 responsive 로 만든다.

    * 만약 canvas 의 너비가 변경이 되면, 모든 라인을 새로 그려야 한다.

    * 글자와 선만 있으면 된다.

        * 동그라미, 네모 이런거 필요 없다.

        * 모바일 터치 이런거 필요 업다. 모바일에서는 그냥 보기만 한다.


    * 각 사용자 마다 다른 canvas 너비를 가지고 있다.

        * 이것은 점을 찍는 마우스 포인트의 x/y 를 각 width/height 으로 하면

            * canvas 의 상대적 위치 값을 얻을 수 있다.

            * 이 값을 상대에게 전달하는 것이다. 즉, canvas 의 절대 포인트 값이 아닌 상대 값을 전달하는 것이다.

    * 단, 높이는 너비의 140% 길이를 같도록 한다.

        모바일에서 상단 메뉴 + 메트로 비디오 레이아웃 + 전자칠판만 보여주면된다.

            
# 기타

# 툴박스 옵션

    - 채팅창을 보이기 숨기기 ( 해드폰에서는 숨기는게 낳지 않나? )

    - 문서(교재) 툴박스를 보이기/숨기기 ( 강사만 보이게 하면 되지 않나? )

    - 방에 누가 접속했는지 툴박스 보이기/숨기기

    - 전체 사용자 박스 숨기기/보이기 ( 이것은 자신의 학생 또는 파트너가 접속했는지 방을 못찻고 있는지, 카메라에 에러가 있는 등을 활용 할 때, )





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