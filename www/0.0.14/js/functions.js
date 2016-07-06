/**
 * ...................................................................
 *
 * Functions
 *
 * ...................................................................
 */
function reload() {
    location.reload(true);
}
/**
 * URL: https://www.onfis.com:10443/0.0.6.html?a=b&c=d&number=4
 * Output : Object {a: "b", c: "d", number: "4"}
 */
function getQueryString() {
    var query = location.href.split('?')[1];
    var qs = {};
    if ( query ) {
        var kvs = query.split('&');
        if ( kvs ) {
            for ( var i in kvs ) {
                var kv = kvs[i].split('=');
                qs[ kv[0] ] = decodeURI(kv[1]);
            }
        }
    }
    return qs;
}



/**
 *
 * @param event
 * @param $v 는 video 객체로 *객체 그대로* 사용을 해야한다.
 *
 */
function roomAddVideo(event, $v) {
    video_count ++;
    //console.log(event);


    console.log(event);

    // 변수들
    var video = event.mediaElement;
    var userid = event.userid;
    var username = event.extra.username;

    var $videos = client.box().find('.videos'); // .videos 박스
    var $v = $(video);

    // 기존에 남아있는 ( 또는 잘못추가된 ) video 태그를 삭제
    $('[userid="'+userid+'"]').remove();

    $v.prop('controls', false);
    var who = '';
    if ( connection.userid == event.userid ) { // 나의 비디오 인가?
        who = 'i';

    }
    else {
        who = 'other';
    }

    $videos.append('<div class="user" who="'+who+'" no="'+video_count+'"></div>');
    $videos.find('[no="'+video_count+'"]')
        .append($v)
        .append('<div class="userid" userid="'+userid+'">'+ username +'</div>');
}

/**
 * 방에 접속하는 사람 수에 따라 자동으로 layout 수정한다.
 *
 */
function videoLayout( style ) {
    if ( style == 'list' ) videoLayout_list();
    else if ( style == 'metro' ) videoLayout_metro();
    else if ( style == 'overlay' ) videoLayout_overlay();
    else videoLayout_metro();

}


/**
 * 한 행에 비디오를 1 개 씩 표시.
 */
function videoLayout_list() {
    Cookies.set('video-list-style', 'list');
    var $thisbtn = client.room().find('.video-layout-list');
    var $btnActive = client.room().find('button.active');
    var $videos = client.room().find('.videos');
    $videos.removeClass('metro');
    $videos.removeClass('overlay');
    $videos.addClass('list');
    $btnActive.removeClass('active');
    $thisbtn.addClass('active');
}

/**
 * 한 행에 비디오를 2개 또는 3개, 4개씩 표시.
 *
 */
function videoLayout_metro() {
    Cookies.set('video-list-style', 'metro');
    var $thisbtn = client.room().find('.video-layout-Metro');
    var $btnActive = client.room().find('button.active');
    var $videos = client.room().find('.videos');
    $videos.removeClass('list');
    $videos.removeClass('overlay');
    $videos.addClass('metro');
    $btnActive.removeClass('active');
    $thisbtn.addClass('active');
}


/**
 * 큰 화면이 하나 있고, 나머지는 작은 화면으로 overlap 된다.
 *
 * @todo 작은 동영상을 클릭하면, 크게 나오도록 한다.
 * 단순히 css 를 잘 조정하면 된다.
 */

function videoLayout_overlay() {
    Cookies.set('video-list-style', 'overlay');
    var $thisbtn = client.room().find('.video-layout-overlay');
    var $btnActive = client.room().find('button.active');
    var $videos = client.room().find('.videos');
    $videos
        .removeClass('list')
        .removeClass('metro')
        .addClass('overlay');
    $btnActive.removeClass('active');
    $thisbtn.addClass('active');
}
$('body').on('click', '.videos.overlay .user', function(){
    console.log('clicked on user of overlay style');
    var $this = $(this);

    //var $videos = client.room().find('.videos .user:last-child').find('video').prop('src', src);

    var $videos = client.room().find('.videos');

     $videos.append( $this );


    var video = $this.find('video')[0];
    video.play(); // This prints an error in console. People says it's a bug of chrome.



    // $this.replaceWith( client.room().find('.videos .user:last-child') );

    //if ( $this )
});

