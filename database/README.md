# 🗄️ Database Setup Guide

This directory contains the essential SQL files for setting up your ReviewInn database with realistic Bangladeshi data.

## 📁 Files Overview

### 1. `unified_database_schema.sql`
**Purpose**: Complete database schema with all tables, indexes, triggers, and constraints
**Usage**: Run this first to create the database structure

**Contains**:
- 🏗️ All table definitions (users, entities, reviews, comments, notifications, etc.)
- 🔍 Optimized indexes for performance
- 🔧 Triggers for automatic updates
- 🛡️ Constraints for data integrity
- 📊 Views for common queries
- 📝 Sample categories and subcategories

### 2. `comprehensive_bangladesh_data.sql`
**Purpose**: Realistic Bangladeshi data for development and testing
**Usage**: Run this after the schema to populate with sample data

**Contains**:
- 👥 **15+ Bangladeshi users** with authentic profiles
- 🏢 **15+ Entities** (restaurants, services, products)
- 📝 **11+ Detailed reviews** with ratings and feedback
- 💬 **20+ Comments** on reviews
- 👍 **50+ Reactions** (likes, loves, etc.)
- 🔔 **10+ Notifications** for user engagement
- 💬 **4 Conversations** with 20+ messages
- 🖼️ **High-quality images** from Unsplash and Pexels

## 🚀 Quick Setup

### Step 1: Create Database Schema
```sql
-- Connect to your PostgreSQL database
psql -U your_username -d your_database

-- Run the unified schema
\i unified_database_schema.sql
```

### Step 2: Populate with Bangladeshi Data
```sql
-- Load realistic data
\i comprehensive_bangladesh_data.sql
```

## 🇧🇩 Bangladeshi Data Features

### 🍽️ **Restaurants & Food**
- কাচ্চি ভাই রেস্টুরেন্ট (Kacchi Bhai Restaurant)
- হাজী বিরিয়ানি (Haji Biryani)
- নান্দনিক রেস্তোরাঁ (Nandanik Restaurant)
- চিটাগাং চা ঘর (Chittagong Tea House)
- সিলেটি রান্নাঘর (Sylheti Kitchen)
- রাজশাহী মিষ্টি ভান্ডার (Rajshahi Sweets)

### 📱 **Digital Services**
- বিকাশ (bKash) - Mobile banking
- পাঠাও (Pathao) - Ride sharing
- দারাজ (Daraz) - E-commerce
- শহোজ (Shohoz) - Delivery service
- চালডাল (Chaldal) - Online grocery

### 🛍️ **Bangladeshi Products**
- ওয়ালটন (Walton) - Electronics
- স্কয়ার ফার্মা (Square Pharma) - Pharmaceuticals
- আরএফএল (RFL) - Home appliances
- জামদানি শাড়ি (Jamdani Saree) - Traditional clothing
- রাজশাহী সিল্ক (Rajshahi Silk) - Silk products
- সিলেটের চা (Sylhet Tea) - Premium tea
- প্রাণ কোম্পানি (PRAN Company) - Food products

### 👥 **User Profiles**
- আহমেদ রহমান - Food critic from Dhaka
- ফাতিমা খান - Fashion blogger from Chittagong
- মোহাম্মদ হাসান - Tea plantation owner from Sylhet
- নাসরিন আক্তার - Silk industry expert from Rajshahi
- তানভীর আহমেদ - IT professional from Dhaka
- And 10+ more authentic profiles

## 🖼️ **Image Sources**

All images are sourced from:
- 📸 **Unsplash** - High-quality professional photos
- 📷 **Pexels** - Free stock photography
- 🎨 **Proper attribution** and licensing compliance

## 📊 **Database Statistics**

After running both files, you'll have:
- ✅ 15+ Bangladeshi users
- ✅ 15+ Entities across different categories
- ✅ 11+ Detailed reviews with authentic content
- ✅ 20+ Meaningful comments
- ✅ 50+ User reactions
- ✅ 10+ Notifications
- ✅ 4 Conversations with 20+ messages
- ✅ Proper view counts and engagement metrics

## 🔧 **Database Configuration**

### Required PostgreSQL Extensions:
```sql
CREATE EXTENSION IF NOT EXISTS ltree;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Recommended Settings:
- PostgreSQL 14+
- UTF-8 encoding for Bengali text support
- Adequate memory allocation for complex queries

## 🛠️ **Maintenance**

### Regular Tasks:
1. **Update Statistics**: Entity ratings and review counts are automatically updated via triggers
2. **Clean Old Data**: Remove test data before production
3. **Monitor Performance**: Check index usage and query performance
4. **Backup Data**: Regular backups of the database

### Performance Optimization:
- All tables have optimized indexes
- Triggers maintain data consistency
- Views provide efficient common queries
- JSONB fields for flexible data storage

## 🐛 **Troubleshooting**

### Common Issues:
1. **Extension Errors**: Ensure `ltree` and `pg_trgm` extensions are installed
2. **Character Encoding**: Use UTF-8 for Bengali text support
3. **Permission Errors**: Ensure proper database user permissions
4. **Memory Issues**: Increase PostgreSQL memory settings for large datasets

### Getting Help:
- Check the main `PROJECT_OVERVIEW.md` for architecture details
- Review `CODING_STANDARDS.md` for development guidelines
- Consult `DATABASE_POLICY.md` for database best practices

## 🎯 **Next Steps**

1. **Run the SQL files** in the correct order
2. **Verify data integrity** using the included verification queries
3. **Test the application** with the populated data
4. **Customize data** for your specific use case
5. **Scale the database** as needed for production

---

## 📜 **License & Attribution**

- **Database Schema**: MIT License
- **Sample Data**: Creative Commons
- **Images**: Unsplash & Pexels (Free for commercial use)

**Last Updated**: 2024-07-17  
**Version**: 1.0.0  
**Compatible with**: PostgreSQL 14+

---

*This database setup provides a solid foundation for your ReviewInn platform with authentic Bangladeshi content and proper data relationships.*