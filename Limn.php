<?php

$wgExtensionCredits['parserhook'][] = array(
    'path'           => __FILE__,
    'name'           => 'Limn',
    'version'        => '0.0.1', 
    'author'         => 'David Schoonover',
    'url'            => 'https://www.mediawiki.org/wiki/Analytics/Limn/MediaWiki_Extension',
    'description'    => 'Embed Limn visualizations in MediaWiki.',
    'descriptionmsg' => 'exampleextension-desc',
);

$wgHooks['ParserFirstCallInit'][] = 'LimnSetupParserFunction';

$wgExtensionMessagesFiles['Limn'] = dirname( __FILE__ ) . '/Limn.i18n.php';

function LimnSetupParserFunction( &$parser ) {
    $parser->setFunctionHook( 'graph', 'LimnGraphParserFunction' );
    return true;
}

function LimnGraphParserFunction( $parser, $graph_id='' ) {
    // The input parameters are wikitext with templates expanded.
    // The output should be wikitext too.
    $output = "<script src='$LIMN_BASE_URL/graphs/$graph_id/embed.thin.min.js'></script>\n"
    
    return $output;
}

