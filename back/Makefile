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

## -- Local --
build:
	mvn package

run: build
	mvn exec:java

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

# -- All --

all: dev # Run docker without sudo by default

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
