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

include .env
export

## -- Non Sudo --
build:
	@echo -e "$(BLUE)$(BOLD)Building...$(RESET)"
	docker compose build

rundev:
	@echo -e "$(GREEN)$(BOLD)Starting on port $(PORT)...$(RESET)"
	docker compose up

dev:
	@echo -e "$(BLUE)$(BOLD)Building...$(RESET)"
	docker compose up --build

# -- Sudo --
sudobuild:
	@echo -e "$(RED)$(BOLD)Running docker as sudo!$(RESET)"
	@echo -e "$(BLUE)$(BOLD)Building...$(RESET)"
	sudo docker compose build

sudorundev:
	@echo -e "$(RED)$(BOLD)Running docker as sudo!$(RESET)"
	@echo -e "$(GREEN)$(BOLD)Starting on port $(PORT)...$(RESET)"
	sudo docker compose up

sudodev:
	@echo -e "$(RED)$(BOLD)Running docker as sudo!$(RESET)"
	sudo docker compose up --build

# -- All --
all: dev

# -- Clean --
clean:
	@echo -e "$(RED)Stopping and removing containers...$(RESET)"
	docker compose down
	@echo -e "\n$(RED)Removing image...$(RESET)"
	-docker rmi $(IMAGE_NAME) 2>/dev/null || true
	@echo -e "\n$(GREEN)$(BOLD)Clean Finished$(RESET)"

sudoclean:
	@echo -e "$(RED)$(BOLD)Running docker as sudo!$(RESET)\n"
	@echo -e "$(RED)Stopping and removing containers...$(RESET)"
	sudo docker compose down
	@echo -e "\n$(RED)Removing image...$(RESET)"
	-sudo docker rmi $(IMAGE_NAME) 2>/dev/null || true
	@echo -e "\n$(GREEN)$(BOLD)Clean Finished$(RESET)"
