/**
 * @file element.js
 *
 */


/**
 *
 * @returns {*|jQuery|HTMLElement}
 */
function lobby() {
    return $('#lobby');
}
function lobbyUsername() {
    return lobby().find('.username');
}


/**
 *
 *
 * @code

 lobbyBox().hide();
 lobbyBox( name ).show();

 * @endcode
 */
function lobbyBox(name) {
    if ( typeof name == 'undefined' ) return lobby().find('.box');
    else return lobby().find('.box.' + name);
}
