###
### Makefile for running backend in a docker container
###

# -- Variables --

# Colors
RESET  := \033[0m
GREEN  := \033[32m
YELLOW := \033[33m
BLUE   := \033[34m
RED    := \033[31m
# Font Style
BOLD := \e[1m
NORMAL := \e[0m


IMAGE_NAME := fcr-backend
PORT := 8080

## -- Help --

help:
	@echo -e "$(BOLD)FCR Backend Makefile$(NORMAL)"
	@echo ""
	@echo -e "$(YELLOW)$(BOLD)Local:$(RESET)"
	@echo -e "  $(GREEN)build$(RESET)                  - compile and package with Maven"
	@echo -e "  $(GREEN)run$(RESET)                    - build and run with Maven"
	@echo ""
	@echo -e "$(YELLOW)$(BOLD)Docker (no sudo):$(RESET)"
	@echo -e "  $(GREEN)docker-build$(RESET)           - build Docker image"
	@echo -e "  $(GREEN)docker-run$(RESET)             - build and run Docker container on port $(PORT)"
	@echo ""
	@echo -e "$(YELLOW)$(BOLD)Docker (sudo):$(RESET)"
	@echo -e "  $(GREEN)sudo-docker-build$(RESET)      - build Docker image with sudo"
	@echo -e "  $(GREEN)sudo-docker-run$(RESET)        - build and run Docker container with sudo on port $(PORT)"
	@echo ""
	@echo -e "$(YELLOW)$(BOLD)Production:$(RESET)"
	@echo -e "  $(GREEN)docker-build-prod$(RESET)      - build production Docker image"
	@echo -e "  $(GREEN)docker-run-prod$(RESET)        - build and run production Docker container on port $(PORT)"
	@echo ""
	@echo -e "$(YELLOW)$(BOLD)Stripe:$(RESET)"
	@echo -e "  $(GREEN)stripe-webhook-listen$(RESET)  - forward Stripe webhooks to localhost:$(PORT)/stripe/webhook"
	@echo ""
	@echo -e "$(YELLOW)$(BOLD)Cleanup:$(RESET)"
	@echo -e "  $(GREEN)clean$(RESET)                  - stop/remove containers and delete image"
	@echo -e "  $(GREEN)sudoclean$(RESET)              - same as clean but with sudo"
	@echo ""
	@echo -e "$(YELLOW)$(BOLD)Utilities:$(RESET)"
	@echo -e "  $(GREEN)gen-secret$(RESET)             - generate a random 32-byte hex secret (e.g. for JWT/API keys)"

## -- Local --
build:
	mvn package

run: build
	mvn exec:java

## -- Production --

docker-build-prod:
	@echo -e "$(BLUE)$(BOLD)Building...$(RESET)"
	docker build -t $(IMAGE_NAME) .

docker-run-prod: docker-build
	@echo -e "$(GREEN)$(BOLD)Starting on port $(PORT)...$(RESET)"
	docker run -d --env-file ./.env -p $(PORT):$(PORT) $(IMAGE_NAME)

stripe-webhook-listen:
	stripe listen --forward-to localhost:$(PORT)/stripe/webhook

## -- Non Sudo --

docker-build:
	@echo -e "$(BLUE)$(BOLD)Building...$(RESET)"
	docker build -t $(IMAGE_NAME) .

docker-run: docker-build
	@echo -e "$(GREEN)$(BOLD)Starting on port $(PORT)...$(RESET)"
	docker run --env-file ./.env -p $(PORT):$(PORT) $(IMAGE_NAME)

# -- Sudo --

sudo-docker-build:
	@echo -e "$(RED)$(BOLD)Running docker as sudo!$(RESET)"
	@echo -e "$(BLUE)$(BOLD)Building...$(RESET)"
	sudo docker build -t $(IMAGE_NAME) .

sudo-docker-run: sudo-docker-build
	@echo -e "$(RED)$(BOLD)Running docker as sudo!$(RESET)"
	@echo -e "$(GREEN)$(BOLD)Starting on port $(PORT)...$(RESET)"
	sudo docker run --env-file ./.env -p $(PORT):$(PORT) $(IMAGE_NAME)

# -- Utilities --

gen-secret:
	@openssl rand -hex 32

# -- All --

all: docker-run # Run docker without sudo by default

# -- Clean --

clean:
	@echo -e "$(RED)Stopping and removing containers...$(RESET)"
	@# xargs -r prevents the "requires at least 1 argument" error if nothing is found
	-docker ps -q --filter ancestor=$(IMAGE_NAME) | xargs -r docker stop
	-docker ps -a -q --filter ancestor=$(IMAGE_NAME) | xargs -r docker rm
	@echo -e "\n$(RED)Removing image...$(RESET)"
	-docker rmi $(IMAGE_NAME) 2>/dev/null || true
	@echo -e "\n$(GREEN)$(BOLD)Clean Finished$(RESET)"

sudoclean:
	@echo -e "$(RED)$(BOLD)Running docker as sudo!$(RESET)\n"
	@echo -e "$(RED)Stopping and removing containers...$(RESET)"
	@# Using sudo with xargs for the protected docker socket
	-sudo docker ps -q --filter ancestor=$(IMAGE_NAME) | xargs -r sudo docker stop
	-sudo docker ps -a -q --filter ancestor=$(IMAGE_NAME) | xargs -r sudo docker rm
	@echo -e "\n$(RED)Removing image...$(RESET)"
	-sudo docker rmi $(IMAGE_NAME) 2>/dev/null || true
	@echo -e "\n$(GREEN)$(BOLD)Clean Finished$(RESET)"
