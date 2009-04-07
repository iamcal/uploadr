// Flickr hostnames
pref('flickr.site_host', 'flickr.com');
pref('flickr.rest_host', 'api.flickr.com');
pref('flickr.upload_host', 'up.flickr.com');

// Default chrome
pref('toolkit.defaultChromeURI', 'chrome://uploadr/content/main.xul');
pref('toolkit.singletonWindowType', 'app');
pref('browser.chromeURL', 'chrome://uploadr/content/dock.xul');

// Debugging
pref('browser.dom.window.dump.enabled', true);
pref('javascript.options.showInConsole', true);
pref('javascript.options.strict', true);
pref('browser.cache.disk.enable', false);
pref('nglayout.debug.disable_xul_cache', true);
pref('nglayout.debug.disable_xul_fastload', true);



// Software updates
pref('app.update.url', 'https://secure.flickr.com/services/uploadr/updates/?product=%PRODUCT%&version=%VERSION%&build_id=%BUILD_ID%&build_target=%BUILD_TARGET%&locale=%LOCALE%&');
pref('app.update.url.manual', 'http://flickr.com/tools/uploadr/');
pref('app.update.url.details', 'http://flickr.com/tools/uploadr/');

// Locale
pref('general.useragent.locale', 'en-US');

// Allow nicely launching their browser
pref('network.protocol-handler.warn-external.http', false);
pref('network.protocol-handler.warn-external.https', false);

//allow preference
pref("browser.preferences.animateFadeIn", false);
pref("browser.preferences.instantApply", true);

// Extension manager
//pref('xpinstall.dialog.confirm', 'chrome://mozapps/content/xpinstall/xpinstallConfirm.xul');
//pref('xpinstall.dialog.progress.skin', 'chrome://mozapps/content/extensions/extensions.xul?type=themes');
//pref('xpinstall.dialog.progress.chrome', 'chrome://mozapps/content/extensions/extensions.xul?type=extensions');
//pref('xpinstall.dialog.progress.type.skin', 'Extension:Manager-themes');
//pref('xpinstall.dialog.progress.type.chrome', 'Extension:Manager-extensions');
pref('extensions.update.enabled', true);
pref('extensions.update.interval', 86400);
pref('extensions.dss.enabled', false);
pref('extensions.dss.switchPending', false);
pref('extensions.ignoreMTimeChanges', false);
pref('extensions.logging.enabled', false);
pref('general.skins.selectedSkin', 'uploadr');
pref('extensions.update.url', 'https://secure.flickr.com/services/uploadr/extensions/?reqVersion=%REQ_VERSION%&id=%ITEM_ID%&version=%ITEM_VERSION%&maxAppVersion=%ITEM_MAXAPPVERSION%&status=%ITEM_STATUS%&appID=%APP_ID%&appVersion=%APP_VERSION%&appOS=%APP_OS%&appABI=%APP_ABI%');
pref('extensions.getMoreExtensionsURL', 'http://flickr.com/tools/uploadr/');
pref('extensions.getMoreThemesURL', 'http://flickr.com/tools/uploadr/');
//pref('extensions.getMorePluginsURL', 'http://flickr.com/tools/uploadr/');
