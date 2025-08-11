.PHONY: help install dev test test-cov lint format clean run docker-build docker-run

# Default target
help:
	@echo "Available commands:"
	@echo "  install     - Install production dependencies"
	@echo "  dev         - Install development dependencies"
	@echo "  test        - Run tests"
	@echo "  test-cov    - Run tests with coverage"
	@echo "  lint        - Run linting (flake8, mypy)"
	@echo "  format      - Format code (black, isort)"
	@echo "  clean       - Clean cache and temp files"
	@echo "  run         - Run the application"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run  - Run Docker container"

install:
	pip install -r requirements.txt

dev:
	pip install -r requirements.txt
	pip install -e .

test:
	pytest

test-cov:
	pytest --cov=. --cov-report=html --cov-report=term

lint:
	flake8 .
	mypy .

format:
	black .
	isort .

clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache
	rm -rf .mypy_cache
	rm -rf htmlcov
	rm -rf .coverage

run:
	python main.py

docker-build:
	docker build -t reviewinn-backend .

docker-run:
	docker run -p 8000:8000 reviewinn-backend
