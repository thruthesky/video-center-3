



function chat_add_message(data) {
    var message = '<div class="message">' + data.username + ' : ' + data.text + '</div>';
    client.addMessage( message );
    chat_scroll_message_box();
}

var chat_scroll_message_box = function() {
    var $message = $('.chat .messages');
    var div = $message.get(0);
    var top = $message.prop('scrollHeight');
    $message.stop().animate({
        scrollTop: top
    }, 380);
};



