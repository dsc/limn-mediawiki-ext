<?php
if (!defined('MEDIAWIKI')) die('omghax');



class Limn {
    
    public static function registerParserHooks( &$parser ) {
        $parser->setHook(           'graph', 'Limn::graphParserHook' );
        $parser->setFunctionHook(   'graph', 'Limn::graphParserFunction' );
        return true;
    }
    
    public static function addModule() {
        global $wgOut;
        $wgOut->addModules( 'ext.limn' );
    }
    
    public static function resourceLoaderGetConfigVars( &$vars ) {
        global $wgLimnServerBase, $wgLimnServerRemoteMode;
        
        $vars['wgLimnOptions'] = array(
            'server' => array(
                'base'          => $wgLimnServerBase,
            ),
            'data' => array(
                'remoteMode'    => $wgLimnDataRemoteMode,
            ),
        );
        
        return true;
    }
    
    
    public static function graph( $graph_id='', $template='graph-chart-only' ) {
        if ( !$graph_id ) return '';
        $output = "<div data-limn-graph='$graph_id' data-template='$template'></div>\n";
        return $output;
    }
    
    public static function graphParserHook( $content, $argv, $parser ) {
        $graph_id = $argv['graph-id'];
        if ( !$graph_id ) return '';
        
        $parser->disableCache();
        
        // self::addModule();
        global $wgOut;
        $wgOut->addModules( 'ext.limn' );
        
        $output = self::graph( $graph_id );
        return $output;
    }
    
    public static function graphParserFunction( $parser, $graph_id='' ) {
        if ( !$graph_id ) return '';
        
        $parser->disableCache();
        
        // self::addModule();
        global $wgOut;
        $wgOut->addModules( 'ext.limn' );
        
        $output = self::graph( $graph_id );
        return array( $output, 'noparse' => true, 'isHTML' => true );
    }
    
    
}
