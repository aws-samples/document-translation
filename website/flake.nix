{
	description = "React Development";
	
	inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05-small";

	outputs = {
		self,
		nixpkgs,
	}: let
		pkgs = import nixpkgs { system ="x86_64-linux"; };
	in {
		devShells.x86_64-linux.default = pkgs.mkShell {
			packages = with pkgs; [
				nodejs_22
        awscli2
        jq
				gnused
				# Optional
				bat
			];
			shellHook = ''bat --style=plain --paging=never ./README.md''; 
		};
	};
}