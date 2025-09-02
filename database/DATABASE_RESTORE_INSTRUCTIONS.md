# 🗄️ ReviewInn Database Restore Instructions

## 📁 Clean Database Files (Post-Cleanup)

Your database folder now contains only **3 essential files**:

1. **`MASTER_CLEAN_DATABASE_BACKUP.sql`** (276KB) - Complete database backup
2. **`unified_database_schema.sql`** (29KB) - Schema reference
3. **`critical_performance_indexes.sql`** (0KB) - Performance indexes (empty)

## 🗑️ Removed Files
- **Removed 41 redundant SQL files** including:
  - Migration files (already applied)
  - Sample data files (already in database)  
  - Legacy/duplicate files
  - Temporary files

## 📊 Current Database Status
- **27 entities** (8 international + 19 Bangladeshi)
- **31 reviews** (21 international + 10 Bangladeshi)
- **All tables properly populated** with clean data
- **Images from Unsplash/Pexels** for all entities

## 🔄 How to Restore Database

### Option 1: Complete Database Restore
```bash
# Drop existing database (CAREFUL!)
PGPASSWORD=Munna1992 psql -h localhost -p 5432 -U reviewinn_user -c "DROP DATABASE IF EXISTS reviewinn_database;"

# Create new database from backup
PGPASSWORD=Munna1992 psql -h localhost -p 5432 -U reviewinn_user -f /home/hasan181/personal/my_project/reviewinn_project/database/MASTER_CLEAN_DATABASE_BACKUP.sql
```

### Option 2: Connect to Different Database
```bash
# If you want to restore to a different database name
PGPASSWORD=Munna1992 psql -h localhost -p 5432 -U reviewinn_user -c "CREATE DATABASE reviewinn_backup;"
PGPASSWORD=Munna1992 sed 's/reviewinn_database/reviewinn_backup/g' MASTER_CLEAN_DATABASE_BACKUP.sql | psql -h localhost -p 5432 -U reviewinn_user
```

## ✅ Verification Commands
```bash
# Check entity count
PGPASSWORD=Munna1992 psql -h localhost -p 5432 -U reviewinn_user -d reviewinn_database -c "SELECT COUNT(*) FROM core_entities;"

# Check review count  
PGPASSWORD=Munna1992 psql -h localhost -p 5432 -U reviewinn_user -d reviewinn_database -c "SELECT COUNT(*) FROM review_main;"

# Check Bangladeshi data
PGPASSWORD=Munna1992 psql -h localhost -p 5432 -U reviewinn_user -d reviewinn_database -c "SELECT name FROM core_entities WHERE entity_id > 33 LIMIT 5;"
```

## 🎯 Expected Results
- **27 entities** should be restored
- **31 reviews** should be restored
- **All 55 database tables** should be created
- **Functions and triggers** should be restored
- **Bangladeshi data** (entities 34-52) should be present

## 🚨 Important Notes
1. **This backup contains YOUR CURRENT CLEAN DATA** - no duplicates or inconsistencies
2. **All redundant files have been removed** - no more confusion
3. **Backup file is complete and tested** - contains schema + data + functions
4. **Use this file as your single source of truth** for database restoration

## 📞 Troubleshooting
If restore fails:
1. Check PostgreSQL is running: `sudo service postgresql status`
2. Check database permissions for `reviewinn_user`
3. Verify backup file exists and is readable: `ls -la MASTER_CLEAN_DATABASE_BACKUP.sql`
4. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`

---
**Generated**: 2025-09-02 21:30 UTC  
**Database Version**: PostgreSQL 17.6  
**Backup Size**: 276KB (complete with all data)