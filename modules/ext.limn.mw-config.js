;(function(mw, $) {
    var wgLimnOptions = mw.config.get('wgLimnOptions')
    ,   opts = window.limn_config = { mwExt:true, mode:'lib', server:{}, render:{} }
    ;
    
    // Add config from extension
    $.extend( opts, wgLimnOptions );
    
    // Force required features
    opts.render.markup = true;
    
})(mediaWiki, jQuery);
