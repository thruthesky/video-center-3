/**
 * @file document.js
 * @desc must be loaded after jQuery.
 * @type {*|jQuery|HTMLElement}
 */


window.addEventListener('message', receiver, false);
function receiver(e) {
    if ( typeof e.data['re'] !== 'undefined' ) {
        var re = e.data['re'];
        if ( re == '1' ) {
            loadBook('data/book/Uploads');
            $('.file-upload').append('<div class="uploaded-loader"><i class="fa fa-spinner fa-spin fa-fw"></i> File uploaded ...</div>');
            setTimeout(function(){
                $('.uploaded-loader').remove();
            }, 1000);

        }
        else {
            alert(e.data['message']);
        }
    }
}

function loadBook(path) {

    var url = bookURL;
    if ( path ) url  += '?dir='  + path;

    console.log( url );
    $.get(url, function(re){
        setTimeout(function(){
            var $content = $('.document-content');
            $content.find('.loader').remove();
            if ( typeof re == 'undefined' || re == '' ) return alert('No files uploaded...');
            try {
                var data = JSON.parse( re );
            }
            catch ( e ) {
                alert( "Error : " + e.message );
            }
            //console.log(data);
            var m = '<ul class="dirs">';
            for ( var i in data['dirs'] ) {
                var dir = data['dirs'][i];
                m += '<li class="book-name" data-dir="'+i+'">' + dir + '</li>';
            }
            m += '</ul>';
            $content.html(m);

            var m = '<ul class="files">';
            for ( var i in data['files'] ) {
                var file = data['files'][i];
                m += '<li class="file-name" data-file="'+i+'">' + file + '</li>';
            }
            m += '</ul>';
            $content.append(m);

        }, 300);
    });
}

function isIE(userAgent) {
    userAgent = userAgent || navigator.userAgent;
    return userAgent.indexOf("MSIE ") > -1 || userAgent.indexOf("Trident/") > -1 || userAgent.indexOf("Edge/") > -1;
}

$(function(){

    var $body = $('body');
    var $loader = '<i class="loader fa fa-spinner fa-spin fa-3x fa-fw"></i>';
    var $content = $('.document-content');
    $content.html( $loader );

    if ( isIE() ) {
        alert( 'Some Features are not Compatible with IE Browser,\n Use Chrome for Better Experience.');
    }
    $('.document form').prop('action', bookServerURL + 'upload.php');
    loadBook();

    $body.on('click', '.books', function() {
        loadBook();
    });
    $body.on('click', '.book-name', function() {
        var $this = $(this);
        loadBook( $this.attr('data-dir') );
    });
    $body.on('click', '.file-name', function() {
        var $this = $(this);
        var dec = ($this.attr('data-file'));
        var url = bookServerURL + dec;
        whiteboard.image( url );
        socket.emit('room-cast', { 'command' : 'whiteboard-image', 'roomname' : client.getRoomName(), 'url': url });
    });

});
