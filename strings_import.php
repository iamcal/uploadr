<?php

# Get rid of the PHP crap that comes back from translation and place the files appropriately

$locale = dirname(__FILE__) . '/MacUploadr.app/Contents/Resources/chrome/locale';

# Gotta have a source folder for all those other languages
if (!isset($argv[1])) {
	die("Usage: $argv[0] <intl-directory>\n");
}

# Clean each directory's files
foreach (array('de-de', 'es-us', 'fr-fr', 'it-it', 'ko-kr', 'pt-br', 'zh-hk') as $l) {
	$dir = opendir("$argv[1]/$l");
	while (false !== $file = readdir($dir)) {

		# Only act on DTD and PROPERTIES files
		if (0 == preg_match('/^.*ext_uploadr3_(.*\.(?:dtd|properties)).txt.php$/', $file, $match)) {
			continue;
		}

		# Make sure the destination directory exists
		if (!file_exists("$locale/$l") && !mkdir("$locale/$l", 0755)) {
			echo "[error] Can't create locale $l\n";
			continue;
		}

		# Clean and save
		$text = file_get_contents("$argv[1]/$l/$file");
		if (false === $text) {
			echo "[error] Reading $file\n";
			continue;
		}
		$text = trim(str_replace("\n\n", "\n", preg_replace('/^<\?php.*\?>$/ms', '', $text)));
		$file = next($match);
		$file_p = fopen("$locale/$l/$file", 'w');
		if (false === $file_p) {
			echo "[error] Opening $file\n";
			continue;
		}
		if (false === fwrite($file_p, $text)) {
			echo "[error] Writing $file\n";
		}
		if (false === fclose($file_p)) {
			echo "[error] Closing $file\n";
		}

	}
	closedir($dir);
}

?>