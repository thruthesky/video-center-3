var wb = {}; // white board object

wb.room = function () { return $('section#room'); };
wb.whiteboard = wb.elem = function () { return client.room().find('.whiteboard'); };


function onMousemove(e){
    var m_posx = 0, m_posy = 0, e_posx = 0, e_posy = 0,
        obj = this;
    //get mouse position on document crossbrowser
    if (!e){e = window.event;}
    if (e.pageX || e.pageY){
        m_posx = e.pageX;
        m_posy = e.pageY;
    } else if (e.clientX || e.clientY){
        m_posx = e.clientX + document.body.scrollLeft
            + document.documentElement.scrollLeft;
        m_posy = e.clientY + document.body.scrollTop
            + document.documentElement.scrollTop;
    }
    //get parent element position in document
    if (obj.offsetParent){
        do {
            e_posx += obj.offsetLeft;
            e_posy += obj.offsetTop;
        } while (obj = obj.offsetParent);
    }
    // mouse position minus elm position is mouseposition relative to element:
    dbg.innerHTML = ' X Position: ' + (m_posx-e_posx)
        + ' Y Position: ' + (m_posy-e_posy);
}


wb.setWhiteboardErase = function () {
    wb.draw = 'e';
    wb.elem().css('cursor', 'pointer'); // apply first
    wb.elem().css('cursor', '-webkit-grab'); // apply web browser can.
};

wb.clear_canvas = function () {
    // Store the current transformation matrix
    wb.canvas_context.save();
    // Use the identity matrix while clearing the canvas
    wb.canvas_context.setTransform(1, 0, 0, 1, 0, 0);
    wb.canvas_context.clearRect(0, 0, wb.canvas.width, wb.canvas.height);
    // Restore the transform
    wb.canvas_context.restore();
    // clear drawing history count
    wb.whiteboard_draw_line_count = 0;
};


/**
 * Whiteboard 초기화 : 페이지 로딩 시 한번만 호출 되어야 한다.
 */
wb.init = function () {
    wb.mouse = {
        click: false,
        move: false,
        pos: { x:0, y:0 },
        pos_prev: { x: 0, y: 0 }
    };
    /**
     * client.draw can have lower 'L' as 'line', 'e' as 'eraser', 't' as 'text'
     * @type {string}
     */
    wb.draw = 'l';


    wb.whiteboard_draw_line_count = 0;

    var $body = $('body');
    var $canvas = wb.elem().find('canvas');

    wb.canvas = document.getElementById("whiteboard-canvas");
    wb.canvas_context = wb.canvas.getContext('2d');

    wb.canvas.onmousedown = function ( e ) {
        wb.mouse.click = true;
        wb.mouse.pos_prev = {x: -12345, y: -12345};

        /**
         * @note 그림을 너무 많이 그리면 부하가 걸리므로 총 3천5백 점(선)으로 그릴 수 있도록 제한한다.
         * 이렇게하면 클라이어트(채팅 상대) 마다 약간씩 점의 수치가 틀린데, ( 이것은 각 컴퓨터 사용자 마다 화면 너비가 틀리고, 넓은 화면에서는 10개의 점을 찍어야 하지만, 좁은 화면에서는 4개의 점만 찍어도 가능한 것 때문은 아닐까? 아니다. 왜냐하면 정확히 그리는 사람의 점의 갯수 만큼 상대방의 캔버스에 그리기 때문이다.
         * 서버에서 하면 정확하겠지만, 서버에 무리가 갈 수 있으므로
         * 여기서 제한 한다.
         * 점을 그리는 것과 지우는 것도 필요하므로,
         * 총 3,500 개의 선(점)을 그릴 수 있게 하면 충분한 것 같다.
         */
        if ( wb.whiteboard_draw_line_count > 3500 ) {
            alert('Too much draw on whiteboard. Please clear whiteboard before you draw more.');
            wb.mouse.click = false;
        }
    };
    wb.canvas.onmouseup = function( e ) {
        wb.mouse.click = false;
        wb.mouse.pos_prev = {x: -12345, y: -12345};
    };
    $canvas.mouseleave( function() {
        wb.mouse.click = false;
        wb.mouse.pos_prev = {x: -12345, y: -12345}
    });
    /**
     * 누군가가 방에 접속을 해서 또는 누군가가 그림을 그리고 있는 도중에
     * whiteboard clear 를 하면 정상적으로 (깨끗하지 않게) clear 될 수 있다.
     */
    $body.on('click', '.whiteboard button.clear', function() {
        //console.log('1. send clear request 2. get clear request 3. clear');
        // @todo see if client.getRoomName() is working on whiteboard.js
        socket.emit('whiteboard-clear', client.getRoomName());
    });
    socket.on('whiteboard-clear', function(roomname) {
        console.log('whiteboard-clear: ' + roomname);
        wb.clear_canvas();
    });

    $body.on('click', '.whiteboard button.eraser', wb.setWhiteboardErase);

    wb.whiteboard_draw_line = function( data ) {
        var w = wb.elem().width();
        var h = wb.elem().height();
        var line = data.line;
        //console.log( line );
        var ox = line[0].x * w;
        var oy = line[0].y * h;
        var dx = line[1].x * w;
        var dy = line[1].y * h;

        if ( data.draw == 'e' ) {
            var radius = 10; // or whatever
            //var fillColor = '#ff0000';
            wb.canvas_context.globalCompositeOperation = 'destination-out';
            //client.canvas_context.fillCircle(dx, dy, radius, fillColor);
            wb.canvas_context.fillStyle = '#ff0000';
            wb.canvas_context.beginPath();
            wb.canvas_context.moveTo(dx, dy);
            wb.canvas_context.arc( dx, dy, radius, 0, Math.PI * 2, false );
            wb.canvas_context.fill();

        }
        else {
            wb.canvas_context.beginPath();
            wb.canvas_context.moveTo( ox, oy);
            wb.canvas_context.lineTo( dx, dy);
            wb.canvas_context.strokeStyle="red";
            wb.canvas_context.stroke();
            wb.whiteboard_draw_line_count ++;
        }
        //console.log('client.whiteboard_draw_line_count:' + client.whiteboard_draw_line_count);
    };

    /**
     *
     * 내가 그림을 그리는 경우, 상대방이  그림을 그릴 때, delay 를 0.1 초 준다. 왜? 그냥...
     * 너무 많이 delay 시키면 실제로 상대방의 전자칠판에 그림이 늦게 그려진다.
     */
    socket.on('whiteboard-draw-line', function(data){
        setTimeout(function(){
            wb.whiteboard_draw_line(data);
        },100);
    });

    /**
     *
     * 방에 처음 접속 할 때, 또는 화면을 resize 할 때, 서버로 부터 기존 그림 정보를 받는다.
     * 그릴 그림이 많은 경우, ( 방에 처음 접속 했을 때, 서버에서 받는 그림 정보 기록이 많은 경우 )
     * 부하를 많이 먹으므로 1.45 초 딜레이 시킨다.
     *
     */
    socket.on('whiteboard-draw-line-history', function(data) {
        setTimeout(function(){
            wb.whiteboard_draw_line(data);
        },1450);
    });


    /**
     * whiteboard 의 상대적 마우스 포인트를 얻는다.
     * @param e
     */

    wb.canvas.onmousemove = function ( e ) {
        if ( ! wb.mouse.click ) return;

        var m_posx = 0, m_posy = 0, e_posx = 0, e_posy = 0,
            obj = this;
        //get mouse position on document crossbrowser
        if ( ! e ) e = window.event;
        if (e.pageX || e.pageY){
            m_posx = e.pageX;
            m_posy = e.pageY;
        } else if (e.clientX || e.clientY){
            m_posx = e.clientX + document.body.scrollLeft
                + document.documentElement.scrollLeft;
            m_posy = e.clientY + document.body.scrollTop
                + document.documentElement.scrollTop;
        }
        //get parent element position in document
        if ( obj.offsetParent){
            do {
                e_posx += obj.offsetLeft;
                e_posy += obj.offsetTop;
            } while ( obj = obj.offsetParent);
        }
        var x = m_posx-e_posx;
        var y = m_posy-e_posy;

        var w = wb.elem().width();
        var h = wb.elem().height();
        //var rx = (x / w);//.toFixed(4);
        //var ry = (y / h);//.toFixed(4);

        var rx = (x / w).toFixed(4);
        var ry = (y / h).toFixed(4);
        //console.log('relative x: ' + rx + ', y: ' + ry);

        wb.mouse.pos.x = rx;
        wb.mouse.pos.y = ry;

        if ( wb.mouse.pos_prev.x == -12345 ) {
            wb.mouse.pos_prev.x = wb.mouse.pos.x;
            wb.mouse.pos_prev.y = wb.mouse.pos.y;
        }

        //console.log( 'prev', client.mouse.pos_prev );
        //console.log( client.mouse.pos );

        var data =  { line : [wb.mouse.pos, wb.mouse.pos_prev] };
        data.roomname = client.getRoomName();
        data.draw = wb.draw;

        socket.emit('whiteboard-draw-line', data);
        wb.whiteboard_draw_line( data );

        wb.mouse.pos_prev.x = wb.mouse.pos.x;
        wb.mouse.pos_prev.y = wb.mouse.pos.y;


    };
};
