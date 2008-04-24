#!/usr/bin/perl

use warnings;
use strict;

open F, $ARGV[0] or die $!;

print chr(255).chr(254); # BOM

while (my $line = <F>){

	my @chars = split //, $line;

	while (scalar @chars){

		my $b1 = ord shift @chars;
		my $val = 0;

		if (($b1 >= 0) && ($b1 <= 0x7F)){
			$val = $b1;
		}

		if (($b1 >= 0xC0) && ($b1 <= 0xDF)){
			my $b2 = ord shift @chars;

			$val = ((0x1F & $b1) << 6) | (0x3F & $b2);
		}

		if (($b1 >= 0xE0) && ($b1 <= 0xEF)){
			my $b2 = ord shift @chars;
			my $b3 = ord shift @chars;

			$val = ((0xF & $b1) << 12) | ((0x3F & $b2) << 6) | (0x3F & $b3);
		}

		if ($b1 > 0xEF){
			$val = ord '?';
		}

		print chr ($val & 0x00FF);
		print chr (($val & 0xFF00) >> 8);
	}
}
close F;
