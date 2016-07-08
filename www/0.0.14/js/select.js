//code#782016 This is while page load showing first element
function initCustomSelect() {
    $('.option').addClass('inactive').hide();
    $('.line-size .option:first').addClass('active').removeClass('inactive').show();
    $('.colors .option:first').addClass('active').removeClass('inactive').show();
}
//Showing all option
$body.on('click', '.select', function(){
    var $option = $(this).find('.option');
    $option.show().css( "display", "block");
});
//Showing selected option
$body.on('mouseleave', '.select', function(){
    var $inactive = $(this).find('.inactive');
    $inactive.hide();
});
//Onclick making the option active
$body.on('click', '.option', function(){
    $('.option').addClass('inactive').removeClass('active');
    $(this).addClass('active').removeClass('inactive');
    $('.option.inactive').hide();
});