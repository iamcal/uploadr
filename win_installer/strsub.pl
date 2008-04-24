#!/usr/bin/perl

use warnings;
use strict;

#
# read the catalogue
#

my $dict = {};

open F, $ARGV[1] or die $!;
while (my $line = <F>){

	if ($line =~ m/^([a-z0-9_.]+)=(.*)/i){

		$dict->{$1} = $2;
	}
}
close F;


#
# convert the file
#

open F, $ARGV[0] or die $!;
while (my $line = <F>){

	$line =~ s/&(\S+);/$dict->{$1}/g;

	print $line;
}
close F;