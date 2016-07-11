//code#782016 This is while page load showing first element

//Showing all option
$body.on('click', '.select', function(){
    var $option = $(this).find('.option.inactive');
    $option.show();
});
//Showing selected option
$body.on('mouseleave', '.select', function(){
    var $inactive = $(this).find('.inactive');
    $inactive.hide();
});
//Onclick making the option active
$body.on('click', '.option', function(){
    var $this = $(this).siblings('.option');
    $this.addClass('inactive').removeClass('active');
    $(this).addClass('active').removeClass('inactive');
    $(this).parent().find('.inactive').hide();
});
