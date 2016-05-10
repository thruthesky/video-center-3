# Video Center 3

Video Conference System By Withcenter, Inc.


# TODO

* UI
    * jQueryUI 1.12 를 사용
        * jQueryUI 1.12 새버젼인데 좀 좋아 보인다.
        * Controllgroup 이 좋음 - http://view.jqueryui.com/1.12.0-beta.1/demos/controlgroup/toolbar.html
        * 이것도 좋음 - http://view.jqueryui.com/1.12.0-beta.1/demos/checkboxradio/product-selector.html


* Mute 를 하면 본인의 컴퓨터에서만 동작을 하지 않을 뿐 상대 컴퓨터에서는 보인다.
    * 해결책으로는 Mute 버튼을 클릭하면 상대편의 컴퓨터에서 자신의 Video 가 안보이게 멈추거나 video element 를 hide 한다.


# 참고

## SSL 필수

* 웹브라우저가 접속하는 scheme 이 SSL 이 아니면 getUserMedia() 를 사용 할 수 없다.

## socket.io 에서 ERR_EMPTY_RESPONSE

* SSL 이 아닌 상태에서 Join Room 을 할 때, socket.io 에러가 발생한다.

