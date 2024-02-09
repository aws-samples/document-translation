{
	description = "Jekyll Development";
	
	inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11-small";

	outputs = {
		self,
		nixpkgs,
	}: let
		pkgs = import nixpkgs { system ="x86_64-linux"; };
	in {
		devShells.x86_64-linux.default = pkgs.mkShell {
			packages = with pkgs; [
				# Prerequisites: https://jekyllrb.com/docs/installation/ubuntu/
				ruby
				libgccjit
				zlib
				# Prerequisites: Other
				rubyPackages_3_3.webrick
				# Jektll: https://jekyllrb.com/docs/
				jekyll
				bundler
			];
		};
	};
}