var whiteboard = wb = function() {
    return $('section#room .whiteboard');
};

wb.room = function () { return $('section#room'); };



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


/**
 * client.draw can have lower 'L' as 'line', 'e' as 'eraser', 't' as 'text'
 * @type {string}
 */
/**
 * Sets the drawing mode of the canvas to "Erasing".
 *
 *      - after calling this function, the user erases the canvas when he draws.
 *
 */
whiteboard.setEraseMode = wb.setWhiteboardErase = function () {
    console.log('wb.setWhiteboardErase()');
    wb.drawMode = 'e';
    whiteboard().css('cursor', 'pointer'); // apply first
    whiteboard().css('cursor', '-webkit-grab'); // apply web browser can.
};


/**
 * Sets the drawing mode of the canvas to "line (dot) drawing".
 *
 *      - after calling this function, the user draws line.
 *
 */
whiteboard.setDrawMode = wb.setWhiteboardLine = function () {
    console.log('wb.setWhiteboardLine()');
    wb.drawMode = 'l';
    whiteboard().css('cursor', 'pointer'); // apply first
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

whiteboard.getLineSize = function () {
    return whiteboard().find('.line-size.selectBox .selected').attr('value'); //code#782016 custom select
};
whiteboard.getColor = function () {
    return whiteboard().find('.colors.selectBox .selected').attr('value'); //code#782016 custom select
};
/**
 *
 * @param e - mouse event
 * @param obj - 캔버스의 parent 들의 높이를 계산하기 위해서 필요.
 */
whiteboard.draw = function( e, obj ) {

//    console.log('whiteboard.draw');

    var m_posx = 0, m_posy = 0, e_posx = 0, e_posy = 0;

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

    var w = whiteboard().width();
    var h = whiteboard().height();
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
    data.lineWidth = whiteboard.getLineSize();
    data.color = whiteboard.getColor();
    data.roomname = client.getRoomName();
    data.drawMode = wb.drawMode;

//    console.log(data);
    socket.emit('whiteboard-draw-line', data);
    wb.drawOnCanvas( data );

    wb.mouse.pos_prev.x = wb.mouse.pos.x;
    wb.mouse.pos_prev.y = wb.mouse.pos.y;

};


wb.drawOnCanvas = function( data ) {
    var w = whiteboard().width();
    var h = whiteboard().height();
    var line = data.line;
    if ( typeof data.lineJoin == 'undefined' ) data.lineJoin = 'round';
    if ( typeof data.lineWidth == 'undefined' ) data.lineWidth = 3;
    if ( typeof data.color == 'undefined' ) data.color = 'black';
    //console.log( line );
    var ox = line[0].x * w;
    var oy = line[0].y * h;
    var dx = line[1].x * w;
    var dy = line[1].y * h;

    var ctx = wb.canvas_context;
    ctx.beginPath();
    ctx.lineJoin = data.lineJoin;


    if ( data.drawMode == 'e' ) {
        ctx.globalCompositeOperation = 'destination-out';
        data.lineWidth = 12;
    }
    else if ( data.drawMode == 'l' ) {
        ctx.globalCompositeOperation = 'source-over';
    }



    // if x and y are equal, then just put a dot.
    if ( ox == dx && oy == dy ) {
        ctx.fillStyle = data.color;
        ctx.arc( dx, dy, data.lineWidth * 0.5, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
    }
    else {
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.lineWidth;
        ctx.moveTo( ox, oy);
        ctx.lineTo( dx, dy);
        ctx.stroke();
    }
    wb.whiteboard_draw_line_count ++;

    //console.log('client.whiteboard_draw_line_count:' + client.whiteboard_draw_line_count);
};


/**
 * Whiteboard 초기화 : 페이지 로딩 시 한번만 호출 되어야 한다.
 */
whiteboard.init = function () {
    wb.mouse = {
        click: false,
        move: false,
        pos: { x:0, y:0 },
        pos_prev: { x: 0, y: 0 }
    };
    whiteboard.setDrawMode();

    wb.whiteboard_draw_line_count = 0;

    var $body = $('body');
    var $canvas = whiteboard().find('canvas');

    wb.canvas = document.getElementById("whiteboard-canvas");
    wb.canvas_context = wb.canvas.getContext('2d');

    wb.canvas.onmousedown = function ( e ) {
        wb.mouse.click = true;
        wb.mouse.pos_prev = {x: -12345, y: -12345};

        /**
         * @see readme.md for 'too much draw'
         */
        if ( wb.whiteboard_draw_line_count > 3500 ) {
            alert('Too much draw on whiteboard. Please clear whiteboard before you draw more.');
            wb.mouse.click = false;
        }

        whiteboard.draw( e, this );

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
     *
     * @note if someone clears whiteboard while the other is drawing, then the whiteboard may not be cleanly cleared.
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

    $body.on('click', '.whiteboard button.eraser', wb.setEraseMode);
    $body.on('click', '.whiteboard button.draw', wb.setDrawMode);

    /**
     *
     *
     * When drawing data hsa delivered to me, it just delays for 0.1 seconds ( for no reason ).
     * Don't delay too much.
     */
    socket.on('whiteboard-draw-line', function(data){
        console.log('whiteboard-draw-line from server');
        setTimeout(function(){
            wb.drawOnCanvas(data);
        },100);
    });

    /**
     *
     *
     *
     * When someone enters a room, it starts to get drawing data and it makes the site(page) slow.
     * So, it gives a little delay.
     *
     *
     */
    socket.on('whiteboard-draw-line-history', function(data) {
        setTimeout(function(){
            wb.drawOnCanvas(data);
        },1000);
    });


    /**
     *
     * Get the relative mouse piont of whiteboard.
     * @param e
     */

    wb.canvas.onmousemove = function ( e ) {
        if ( ! wb.mouse.click ) return;
        whiteboard.draw( e, this );
    };
};


/**
 * Shows / Hides whiteboard.
 *
 * @note when on shows/hides his whiteboard, all participant whiteboard must follow.
 */
whiteboard.toggle = function () {
    client.room().toggleClass('has-whiteboard');
    var $btnActive = client.room().find('.button-whiteboard');
    if ( client.room().hasClass('has-whiteboard') ) {
        // client.room().addClass('.whiteboard');
        $btnActive.addClass('show');
        socket.emit('room-cast', { 'command' : 'whiteboard-show', 'roomname' : client.getRoomName() });
    }
    else {
        // client.room().removeClass('.whiteboard');
        $btnActive.removeClass('show');
        socket.emit('room-cast', { 'command' : 'whiteboard-hide', 'roomname' : client.getRoomName() });
    }
};

whiteboard.show = function() {
    client.room().addClass('has-whiteboard');
};
whiteboard.hide = function() {
    client.room().removeClass('has-whiteboard');
};


whiteboard.image = function ( url ) {
    $('.whiteboard').css( 'background-image', 'url("'+url+'")');
};
