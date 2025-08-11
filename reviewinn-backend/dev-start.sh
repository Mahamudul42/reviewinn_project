#!/bin/bash
# Development startup script for Review Platform API

set -e

echo "🚀 Starting Review Platform API in Development Mode"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your configuration!"
fi

# Check database connection
echo "🗄️  Checking database connection..."
python -c "from database import check_database_connection; check_database_connection()" || {
    echo "❌ Database connection failed. Please check your DATABASE_URL in .env"
    exit 1
}

# Run database migrations (if alembic is configured)
if [ -d "alembic" ]; then
    echo "🔄 Running database migrations..."
    alembic upgrade head
fi

# Start the application
echo "🌟 Starting FastAPI application..."
python main.py
