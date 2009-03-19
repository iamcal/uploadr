<?
	#
	# this config block lists the regexps to run against strings in language files
	#
	# we can use this to check that translated versions have the required magic
	# characters, such as the ^^linked word^^ syntax.
	#

	$rx_hats = '!\^\^(.*?)\^\^!';

	$check = array(
		'installer.properties' => array(
			'title.version'				=> '!\${VERSION}!',
			'title.version.inst'			=> '!\${VERSION}!',
		),
		'main.dtd' => array(
			'help.offline'				=> $rx_hats,
			'help.drag'				=> $rx_hats,
			'help.faq'				=> $rx_hats,
			'!photos.init.text.joined'		=> '!.+!',
		),
		'main.properties' => array(
			'video.add.restricted.sz.guidelines'	=> $rx_hats,
			'video.add.restricted.pz.guidelines'	=> $rx_hats,
			'video.add.restricted.sp.guidelines'	=> $rx_hats,
			'video.add.restricted.pp.guidelines'	=> $rx_hats,
			'video.edit.restricted.sz.guidelines'	=> $rx_hats,
			'video.edit.restricted.pz.guidelines'	=> $rx_hats,
			'video.edit.restricted.sp.guidelines'	=> $rx_hats,
			'video.edit.restricted.pp.guidelines'	=> $rx_hats,
		),
		'proxy.dtd' => array(
			'connectionDesc.label'			=> '!\&brandShortName\;!',
		),
	);


	#
	# ignore everything below this line :)
	#

	#########################################################################################


	$locales = dirname(__FILE__).'/MacUploadr.app/Contents/Resources/chrome/locale';

	$dh = opendir($locales);
	while ($file = readdir($dh)){

		if (is_dir("$locales/$file") && preg_match('!^[a-z0-9]{2}-[a-z0-9]{2}$!i', $file)){

			check_language($file, $check);
		}
	}
	closedir($dh);

	#########################################################################################

	function check_language($lang, $check){

		echo "checking $lang: "; flush();

		foreach ($check as $file => $strings){

			$catalogue = load_strings($lang, $file);

			foreach ($strings as $key => $rx){

				if ($key{0} == '!'){

					if (preg_match($rx, $catalogue[substr($key, 1)])){

						echo "\nMatched $rx against $catalogue[$key]\n";

					}else{
						echo '.'; flush();
					}

				}else{

					if (!preg_match($rx, $catalogue[$key])){

						echo "\nFailed to match $rx against $catalogue[$key]\n";

					}else{
						echo '.'; flush();
					}
				}
			}
		}

		echo "done\n"; flush();
	}

	#########################################################################################

	function load_strings($lang, $filename){

		$path = dirname(__FILE__).'/MacUploadr.app/Contents/Resources/chrome/locale/'.$lang.'/'.$filename;

		$lines = file($path);
		$dict = array();

		if (preg_match('!\.dtd$!', $filename)){

			foreach ($lines as $line){

				if (preg_match('!ENTITY\s+([A-Za-z0-9._]+)\s+"([^"]+)"!', $line, $m)){

					$dict[$m[1]] = $m[2];
				}
			}
		}

		if (preg_match('!\.properties$!', $filename)){

			foreach ($lines as $line){

				if (preg_match('!^([a-z0-9-.]+)=(.*)$!i', $line, $m)){

					$dict[$m[1]] = $m[2];
				}
			}
		}

		return $dict;
	}

	#########################################################################################
?>