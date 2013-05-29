# Limn MediaWiki Extension

A [MediaWiki][mediawiki] extension to embed [Limn][limn] visualizations via wikitext.
Limn aims to further democratize data exploration by providing a backend-agnostic GUI
for building visualizations without need of programming skills, pairing nicely with
the open content tools provided by MediaWiki.

**This extension is a work in progress!** It was created as a prototype at a recent hackathon;
kindly pardon the mess while things get smoothed out.


## WikiText API

The embedding API is provided via a tag and a parser function which have
identical functionality:

- Function: `{{#graph:<GRAPH_ID>|<OPTION_KEY>=<OPTION_VAL>|...}}`
- Tag: `<graph graph-id="<GRAPH_ID>" <OPTION_KEY>="<OPTION_VAL>" ... />`

These both add Limn to the page, and instruct it to render the graph with the
given `GRAPH_ID` at the location of the call. The graph definition and data
will be pulled from an existing Limn server configured via the extension (see 
below).

Currently, all options are a TODO, but the plan is to support:

* `width`, `height` -- Set the size of the graph container.
* `float={none | left | right }` -- Float the graph container in surrounding text.


## Installation

Install into `mediawiki/extensions/Limn`, and then load the extension in your
configuration file (`LocalSettings.php` or whatever):

```php
require_once( "$IP/extensions/Limn/Limn.php" );
$wgLimnServerBase = 'http://dev-reportcard.wmflabs.org/';
$wgLimnServerRemoteMode = 'proxy';
```

Given the above, the extension would expect a Limn server running at
http://dev-reportcard.wmflabs.org/ with `proxy` enabled for fetching remote
data-files.


## Configuration

Much like API options, most configuration is aspirational.

| Ext Var                 | Limn Conf         | Type                     | Default      | Description                                                                                                                                       |
| ----------------------- | ----------------- | ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$wgLimnServerBase`     | `server.base`     | URL                      | **Required** | Sever URL prefix, used to load resources and data files.                                                                                          |
| `$wgLimnDataRemoteMode` | `data.remoteMode` | `proxy`, `cors`, `error` | `error`      | Handling for remote datafiles: use Limn Proxy, assume CORS, or show an error.                                                                     |
| `$wgLimnDataLazy`       | `data.lazy`       | `Boolean`                | `false`      | **TODO** Renderables wait until render to load required resources (self, datasources, datafiles, etc); implies `render.lazy`.                     |
| `$wgLimnRenderLazy`     | `render.lazy`     | `Boolean`                | `false`      | **TODO** Renderables wait until visible and scrolled into viewport before rendering. If `data.lazy` is false, resources will still be pre-loaded. |


## Feedback

Find a bug or want to contribute? Open a ticket (or fork the source!) on [github][project].
You're also welcome to send me email at [dsc@less.ly][dsc_email].


## License

[Limn Mediawiki extension][project] was written by [David Schoonover][dsc]. It is open-source software and freely available under the [MIT License][mit_license].


[project]: https://github.com/dsc/limn-mediawiki-ext "Limn Mediawiki Extension on GitHub"
[dsc]: https://github.com/dsc/ "David Schoonover"
[dsc_email]: mailto:dsc+limn-mw-ext@less.ly?subject=limn-mediawiki-ext "dsc@less.ly"
[mit_license]: http://dsc.mit-license.org/ "MIT License"

[limn]: https://github.com/wikimedia/limn "Limn on GitHub"
[mediawiki]: http://mediawiki.org/ "MediaWiki"
