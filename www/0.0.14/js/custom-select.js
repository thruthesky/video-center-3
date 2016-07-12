/*code#782016 on load this will also display the 1st option*/
$(document).ready(function(){
    $('div.selectBox').each(function(){
        var $selectBox = $(this);
        var $selected = $selectBox.find( '.selected' )
        var $options = $(this).find( '.options' );
        var $firstOption = $options.children( '.option:first' );
        $selected
            .html( $firstOption.html() )
            .attr( 'value', $firstOption.attr('value') );

        $selectBox.click(function(){
            if( $options.css( 'display' ) == 'none' ) {
                $options.css( 'display','block' );
            }
            else
            {
                $options.css('display','none');
            }
        });
        $selectBox.find('.option').click(function(){
            var $option =  $(this);
            $selected
                .html( $option.html() )
                .attr( 'value', $option.attr('value') );
        });
        $selectBox.mouseleave(function(){
            $options.css('display','none');
        });
    });
});