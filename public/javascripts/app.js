$(() => {
    $('#search_btn').click(() => {
        $('#searchForm').addClass('open-search');
        return false;
    });
    $(document).click((e) => {
        if ($(e.target).closest('#searchForm').length === 0) {
            $('#searchForm').removeClass('open-search');
        }
    });
    const href = location.href;
    $('.index-nav a').each(() => {
        if (href === this.href) {
            $(this).addClass('current');
        }
    });
    $('[data-date]').each(() => {
        const self = $(this);

        let str = self.data('date');
        str = new Date(str);
        moment.locale('zh-cn');
        str = moment(str).fromNow();

        self.text(str);
    });
});

function isCanvasSupported() {
    const elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));
}