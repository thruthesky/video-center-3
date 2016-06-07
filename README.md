# Video Center 3

Video Conference System By Withcenter, Inc.


# TODO


* 웹 서버 기능은 모두 Nginx 로 대체한다. 그래야 멀티 도메인 443 포트를 사용 할 수 있다.


* 모든 단계에서 setTimeout 이나, ajax, callback 등을 사용 할 때, loader 를 보여 줄 것.


* 로비에서는 채팅창, 문서창, 전자칠판을 보여주지 않는다.


* https://domain@videocenter.co.kr/ 과 같이 접속을 하도록 한다.
* video relay server 는 사무실 안에서 같은 네트워크를 사용해야 한다. 그래야 빨리 데이터 송수신이 가능하다.

* Sqlite3 에
    * 기본 설정
        * 화상 솔루션 로고, 화상 솔루션 이름, 회사 정보
        * 최고 관리자가 각 도메인 별 인원수 제한
    * 사용자 접속 기록,
        * 모든 로그인 / 로그 아웃 및 로그인을 하지 않았어도 도메인 별 IP 기록 등.

* 대충 완료를 위한 종료를 한다.

* 버그. 캔버스에서 내용을 좀 지우고, re-connect 하면, 내용은 지워 지는데,
    * 문제는 맨 마지막에 그린 그림이 희미해 진다.

* 그리기 툴 박스

    * 선 굵기 ( 버튼 1,2,3 ) 을 곧바로 선택
    * 폰트 크기
    * 색상
    * 전체 지우기
    * 부분 지우기


* 문서 기능
    * 디렉토리 분류를 해서, 바로 사진 업로드 ( 즉, 교재를 즉시 업로드 )
    * 디렉토리 분류를 화면에 바로 보이도록.
    * 관리자가 한명이 있어서 잘 정리 해야한다.
        교재명(폴더)/페이지번호(또는 Unit 번호).jpg
        예) Side By Side 1/1.jpg
        예) Side By Side 2 3rd Edition/23.jpg
    * 교재를 미리 업로드 하지 않고 그때 그때 없로드 해서 사용 할 수 있도록 한다.
        예) 저작권이 있는 정보.

    * 웹 사이트 공유는 안되고 대신 강사가 스크린샷을 해서 미리 준비하도록 한다.

* 화면이 재조정 되거나 새로 들어가면 그림을 다시 그리는데 시간이 오래 걸린다.
    * 다시 그리는 그림은 모아서 한꺼번에 그린다. 그림 데이터를 다 다운로드한 다음에 다시 그리는 것이다.

* 화면에 직접 그린 그림(선)이 많으면 입장을 할 때, 그려야 할 데이터가 많아서 동영상이 늦게 뜬다.

    * 방에 접속하자 마자 서버에서 클라이언트로 선 정보를 보내기 때문인 것 같다.

     * 선 정보를 보내느라 signaling 데이터를 서버로 바로 못보내는 것 같다. 그래서 동영상이 늦게 뜬다.

     * 따라서 해결 책은, 전자칠판에 너무 많이 선을 그리면 알림을 띄우고 화면을 지우고 다시 그리라고 함.

     * 화면 지움 버튼을 클릭하면, 서버의 버퍼를 비운다.

* 지우개는 반드시 필요한다. 강사가 그림을 하나씩 그리다가 나중에는 반대로 하나씩 없애야 할 수 있다.
    * 지우개 지우는 것도 draw line history 에 적용을 해야 한다.
    * 따라서 draw line history 는 3천개 정도의 점으로 유지하는게 적당하다.

* 도메인 관리자는 자신의 강사 또는 학생에게 실시간 메세지를 보낼 수 있다.

* 옵저버 모드로 접속하는 방법.


* 칠판 너비는 100% 로 하되, 높이는 너비 비율의 1.4 로 항상 맞춘다.
    높이 비율이 컴퓨터 마다 틀리면 그림이 이상하게 그려진다.


* done - Signaling-Server.js 에 넣은 코드를 모두 빼서
    * video-center.js 에 집어 넣어 Signaling-Server.js 로 부터 완전히 코드를 분리해서
    * Signaling-Server.js 및 기타 소스 코드를 업데이트 한다.


* done - 동시에 두명이 그리는 것.
* done - 방의 그림 정보를 방에 저장한다. 그래서 방이 파괴되면 자동으로 파괴되도록 한다.
* done - canvas 가 resize 되면 모든 그림 정보를 초기화 하는가? 그렇다면 서버로 부터 다시 값을 불러와서 그려야 한다.
* 교재는 모두 https 상에 있어야 한다.
    * 교재는 모두 이미지로 한다.
    * 홈페이지는 rwd 라서 전자칠판을 사용 할 수 없으므로
        - 모든 교재용 정보(홈페이지 등)는 JPG 으로 저장한다.

* 확실히 느린 컴퓨터와는 연결이 잘 안된다. 2008 년 또는 2012년에 구매한 넷북은 동영상이 보이고 몇명과 접속 되지만, 전체 접속이 안되고, 그 후에는 아예 동작을 하지 않는다.
   * 넷북 뿐만아니라 구형의 오래된 컴퓨터와도 연결되지 않았다.




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

# 코딩 가이드

서버는 에러가 난다고 해서 stop 되어져 버리면 안된다.

따라서 많은 곳에 try {} 기능을 넣는다.

* 에러가 있는 경우 socket.emit('error', ...); 와 같이 해서 곧 바로 에러 정보를 클라이언트로 내 보낸다.