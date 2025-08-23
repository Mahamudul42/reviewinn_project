# ReviewInn 🏨✨

A comprehensive enterprise-grade review platform built with modern web technologies. Supports reviews for restaurants, services, products, and more with Bengali/Bangladeshi cultural context.

## 🌟 Key Features

- **Multi-Category Reviews** - Restaurants, Services, Products with Bengali support
- **Enterprise Architecture** - Scalable database schema with 72+ tables
- **Real-time Messaging** - User-to-user conversations and group chats
- **Advanced Notifications** - Real-time notification system
- **User Management** - Comprehensive user profiles with gamification
- **Review System** - Detailed reviews with ratings, pros/cons, and reactions
- **Bengali Content** - Full Bengali language support for Bangladeshi users

## 📁 Project Structure

```
reviewinn_project/
├── 🗄️ Database & Data
│   ├── database/                   # Database schema and sample data
│   │   ├── *.sql                  # Database schema files
│   │   ├── sample-data/           # Sample data for testing
│   │   └── migrations/            # Database migration scripts
│   ├── backups/                   # Database backup files
│   └── reviewinn_enterprise_schema_backup.sql  # Complete schema backup
├── 📱 Applications
│   ├── reviewinn-frontend/        # React + TypeScript frontend
│   ├── reviewinn-backend/         # FastAPI backend with enterprise features
│   └── reviewinn-admin/           # Django admin panel
├── 🛠️ Scripts & Tools
│   └── scripts/
│       ├── database/              # Database management scripts
│       ├── development/           # Development helper scripts
│       └── utils/                 # Utility scripts
├── 🐳 Infrastructure
│   ├── docker-compose.yml         # Complete Docker setup
│   └── run.sh                     # Main management script
└── 📄 Configuration
    └── .gitignore                 # Git ignore rules
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.9+ (for backend development)

### Instant Setup with Docker
```bash
# Clone the repository
git clone <repository-url>
cd reviewinn_project

# Start all services with Docker
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
# Admin Panel: http://localhost:8001
```

### Sample Data Included
The application comes pre-populated with authentic Bengali sample data:
- **5 Users** - Food critics, fashion bloggers, tech reviewers from Bangladesh
- **8 Entities** - Restaurants, digital services, and traditional products
- **Reviews** - Detailed Bengali reviews with cultural context
- **Messaging** - Sample conversations between users
- **Notifications** - Real-time notification examples

## 🏗️ Enterprise Architecture

### Database Schema (72+ Tables)
- **User Management** (9 tables) - Users, profiles, authentication
- **Review System** (7 tables) - Reviews, ratings, reactions
- **Messaging** (11 tables) - Real-time chat system
- **Governance & Security** (7 tables) - Audit trails, compliance
- **Analytics & Monitoring** (15+ tables) - Performance tracking
- **Content Management** (20+ tables) - Entities, categories, moderation

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + PostgreSQL 17 + Redis 7
- **Infrastructure**: Docker + Docker Compose
- **Database**: Enterprise-grade PostgreSQL schema with proper relationships

## 🎯 Sample Data Features

### 👤 Sample Users
- **আহমেদ রহমান** - Food critic specializing in Bengali cuisine
- **ফাতিমা খান** - Fashion blogger expert in traditional clothing
- **মোহাম্মদ হাসান** - Tea plantation owner from Sylhet
- **নাসরিন আক্তার** - Silk artisan from Rajshahi
- **তানভীর আহমেদ** - Software engineer and tech reviewer

### 🏢 Sample Entities
- **Restaurants**: কাচ্চি ভাই রেস্টুরেন্ট, হাজী বিরিয়ানি, নান্দনিক রেস্তোরাঁ
- **Services**: বিকাশ (Mobile Banking), পাঠাও (Ride Sharing)
- **Products**: ওয়ালটন (Electronics), জামদানি শাড়ি, সিলেটের চা

### 📊 Sample Data Stats
- **5 Verified Users** with authentic Bengali profiles
- **8 Entities** across different categories
- **3 Detailed Reviews** with 4.5 star average rating
- **5 Notifications** including reactions and follows
- **3 Conversations** with 12 authentic Bengali messages

## 🛠️ Development

### Backend Development
```bash
cd reviewinn-backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd reviewinn-frontend
npm install
npm run dev
```

### Database Management
```bash
# View database schema
psql -h localhost -p 5432 -U reviewinn_user -d reviewinn_database

# Load sample data (already included in Docker setup)
psql -h localhost -p 5432 -U reviewinn_user -d reviewinn_database -f database/comprehensive_bangladesh_data.sql
```

## 🌍 Bengali/Bangladeshi Context

This platform is specifically designed for Bangladeshi users with:
- **Bengali Language Support** - Full Bengali content and UI elements
- **Cultural Authenticity** - Reviews and content reflect Bangladeshi culture
- **Local Businesses** - Sample data includes real Bangladeshi businesses
- **Traditional Products** - Focus on local products like জামদানি, চা, etc.

## 📦 Deployment

The application is production-ready with:
- **Docker Compose** setup for easy deployment
- **Environment Configuration** through Docker
- **Database Backups** included in repository
- **Health Checks** for all services
- **Enterprise Security** features built-in

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**ReviewInn** - *বাংলাদেশের জন্য রিভিউ প্ল্যাটফর্ম* ⭐