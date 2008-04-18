#!/usr/bin/perl

use warnings;
use strict;
use Cwd;

$|++;


#
# 1. Build the locale list
#

my $dir = getcwd;
my $locales = {};

opendir DH, "$dir/locale" or die "can't open locale folder: $!";
while (my $name = readdir(DH)){

	if ($name =~ m/^[a-z]{2}-[a-z]{2}$/i){

		$locales->{$name} = 1;
	}
}
closedir DH;


#
# 2. build the JARs
#

`rm $dir/??-??.*`;

`mkdir $dir/build`;
`rm -r $dir/build/*`;

for my $locale(keys %{$locales}){

	print "Building $locale.jar...";

	mkdir "$dir/build/locale";
	mkdir "$dir/build/locale/$locale";

	&copy_files_to("$dir/locale/$locale/", "$dir/build/locale/$locale/");

	chdir "$dir/build";

	`7z.exe a -r -tzip $locale.zip locale -mx1`;
	`mv $locale.zip ../$locale.jar`;

	`rm -r $dir/build/locale`;

	print "ok\n";
}

`rm -r $dir/build`;


#
# 3. build the manifests
#

chdir $dir;

for my $locale(keys %{$locales}){

	print "building $locale.manifest...";

	`perl -p -e 's/LOCALE/$locale/g' manifest.template > $locale.manifest`;

	print "ok\n";
}


#
# 4. all done!
#

print "ok, all done!\n";




sub copy_files_to {

	my ($src, $dst) = @_;

	my @lines = split "\n", `find $src | grep -v .svn`;

	my $src_q = quotemeta $src;

	for my $file (@lines){

		$file =~ s/^$src_q//;

		if (length $file){

			if (-f "$src$file"){

				`cp $src$file $dst$file`;
			}

			if (-d "$src$file" && !-d "$dst$file"){

				`mkdir $dst$file`;
			}
		}
	}
}