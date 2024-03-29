{
	description = "Docs Development";
	
	inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11-small";

	outputs = {
		self,
		nixpkgs,
	}: let
		pkgs = import nixpkgs { system ="x86_64-linux"; };
	in {
		devShells.x86_64-linux.default = pkgs.mkShell {
			packages = with pkgs; [
				hugo
				go
				# Optional
				bat
			];
			shellHook = ''bat ./README.md''; 
		};
	};
}