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

		# Clean PHP garbage out
		$text = file_get_contents("$argv[1]/$l/$file");
		if (false === $text) {
			echo "[error] Reading $file\n";
			continue;
		}
		$text = trim(str_replace("\n\n", "\n", preg_replace('/^<\?php.*\?>$/ms', '', $text)));

		# Process each string
		$lines = explode("\n", $text);
		$ii = sizeof($lines);
		$replace = array();
		for ($i = 0; $i < $ii; ++$i) {

			# Escape & and " properly
			if (preg_match('/^(<!ENTITY [a-zA-Z0-9.]+ ")(.+)(">)$/', $lines[$i], $s)) {
				$lines[$i] = $s[1] . str_replace('"', '&#34;',
					preg_replace('/&(?!#\d\d;)/', '&#38;', $s[2])) . $s[3];
			}

			# Split up combined complicated strings
			if (preg_match('/^<!ENTITY ([a-zA-Z0-9.]+) "(.+)">$/', $lines[$i], $s)
				&& preg_match('/^(.+)\.joined$/', $s[1], $k)) {
				$parts = explode('  ', $s[2]);
				if (2 == sizeof($parts)) {
					$replace["{$k[1]}.1"] = "{$parts[0]} ";
					$replace["{$k[1]}.2"] = " {$parts[1]}";
					$lines[$i] = '';
				}
			}

		}

		# Replace split up versions with their translations
		for ($i = 0; $i < $ii; ++$i) {
			if (preg_match('/^<!ENTITY ([a-zA-Z0-9.]+) ".+">$/', $lines[$i], $s)
				&& isset($replace[$s[1]])) {
				$lines[$i] = "<!ENTITY {$s[1]} \"{$replace[$s[1]]}\">";
			}
		}

		# Write and save
		$file = next($match);
		$file_p = fopen("$locale/$l/$file", 'w');
		if (false === $file_p) {
			echo "[error] Opening $file\n";
			continue;
		}
		if (false === fwrite($file_p, array_diff($lines, array('')))) {
			echo "[error] Writing $file\n";
		}
		if (false === fclose($file_p)) {
			echo "[error] Closing $file\n";
		}

	}
	closedir($dir);
}

?>