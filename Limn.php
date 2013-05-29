<?php
if (!defined('MEDIAWIKI')) die('omghax');
/**
 * Limn Extension for Mediawiki
 *
 * @file
 * @ingroup Limn
 * @ingroup Extensions
 *
 * @author David Schoonover <dsc@less.ly>
 * @version 0.0.1
 * @license MIT
 */


// Credits

$wgExtensionCredits['parserhook'][] = array(
    'path'           => __FILE__,
    'name'           => 'Limn',
    'version'        => '0.0.1',
    'author'         => 'David Schoonover',
    'url'            => 'https://github.com/dsc/limn-mediawiki-ext',
    'description'    => 'Embed Limn visualizations in MediaWiki.',
);


// Configuration

$wgLimnServerBase = null;

$wgLimnDataRemoteMode = 'error';


// Extension Setup

$wgAutoloadClasses += array(
    'Limn' => __DIR__ . '/Limn_body.php',
);

$wgExtensionMessagesFiles += array(
    'Limn'      => __DIR__ . '/Limn.i18n.php',
    'LimnMagic' => __DIR__ . '/Limn.i18n.magic.php',
);

$wgResourceModules += array(
    'ext.limn' => array(
        'scripts' => array(
            'modules/ext.limn.mw-config.js',
            'modules/ext.limn-mw-deps.js',
            'modules/ext.limn.js',
            'modules/ext.limn.binding.js',
        ),
        'styles'        => 'modules/ext.limn.css',
        'localBasePath' => __DIR__,
        'remoteExtPath' => 'Limn',
        'group'         => 'ext.limn',
    ),
);


// Hooks

$wgHooks['ParserFirstCallInit'][]         = 'Limn::registerParserHooks';
$wgHooks['ResourceLoaderGetConfigVars'][] = 'Limn::resourceLoaderGetConfigVars';

