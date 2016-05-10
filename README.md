# Video Center 3

Video Conference System By Withcenter, Inc.


# TODO

* UI
    * jQueryUI 1.12 를 사용
        * jQueryUI 1.12 새버젼인데 좀 좋아 보인다.
        * Controllgroup 이 좋음 - http://view.jqueryui.com/1.12.0-beta.1/demos/controlgroup/toolbar.html
        * 이것도 좋음 - http://view.jqueryui.com/1.12.0-beta.1/demos/checkboxradio/product-selector.html


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
