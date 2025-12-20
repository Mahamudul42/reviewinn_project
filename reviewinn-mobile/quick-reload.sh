#!/bin/bash
# Quick Hot Reload Reminder

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}         🔥 HOT RELOAD YOUR CHANGES 🔥${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Go to your Flutter terminal and press:${NC}"
echo ""
echo -e "  ${YELLOW}r${NC}  - Hot reload (1-2 seconds) ⚡"
echo -e "  ${YELLOW}R${NC}  - Hot restart (5-10 seconds)"
echo ""
echo -e "${GREEN}Your app: http://localhost:8085${NC}"
echo ""
echo -e "${CYAN}Tip:${NC} Keep Flutter terminal visible for easy access!"
echo ""
