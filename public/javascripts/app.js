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
    var href = location.href;
    $('.index-nav a').each(function(){
        if (href == this.href) {
            $(this).addClass('current');
        }
    });
    $('[data-date]').each(function(){
        var self = $(this);

        var str = self.data('date');
        str = new Date(str);
        moment.locale('zh-cn');
        str = moment(str).fromNow();
        
        self.text(str);
    });
});