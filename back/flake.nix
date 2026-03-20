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
                        echo "Commands:"
                        echo "  mvn compile        - compile"
                        echo "  mvn exec:java      - run"
                        echo "  mvn package        - build fat jar"
                        echo "  java -jar target/fcr-api-0.1.0-jar-with-dependencies.jar - run jar"
                    '';
                };
            }
        );
}
