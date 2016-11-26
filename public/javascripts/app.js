$(function(){
    $('#search_btn').click(function(){
        $('#searchForm').addClass('open-search');
        return false;
    });
    $(document).click(function(e){
        if ($(e.target).closest('#searchForm').length === 0) {
            $('#searchForm').removeClass('open-search');
        }
    });
});