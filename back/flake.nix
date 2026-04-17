{
    description = "FCR API - Javalin Java API";

    inputs = {
        nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
        flake-utils.url = "github:numtide/flake-utils";
    };

    outputs =
        {
            self,
            nixpkgs,
            flake-utils,
        }:
        flake-utils.lib.eachDefaultSystem (
            system:
            let
                pkgs = nixpkgs.legacyPackages.${system};
            in
            {
                devShells.default = pkgs.mkShell {
                    buildInputs = with pkgs; [
                        jdk21
                        maven
                        stripe-cli
                        openssl
                    ];

                    shellHook = ''
                        if [ -f .env ]; then
                          export $(grep -v '^#' .env | xargs)
                          echo "Loaded .env"
                        fi
                        echo "FCR API Dev Shell"
                        echo "Java: $(java -version 2>&1 | head -1)"
                        echo "Maven: $(mvn -version 2>&1 | head -1)"
                        echo ""
                        make help
                    '';
                };
            }
        );
}
