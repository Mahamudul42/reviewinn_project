# 🔒 Database Backup & Recovery System

## Overview

This system provides comprehensive database backup and recovery capabilities to prevent data loss. It automatically backs up your database before restart operations and provides manual backup/restore commands.

## ✨ Features

### Automatic Protection
- 🛡️ **Auto-backup before restart**: `./run.sh restart` creates backup automatically
- 🛡️ **Auto-backup before rebuild**: `./run.sh rebuild` creates backup automatically
- 🔄 **Smart cleanup**: Keeps last 20 backups, removes backups older than 5 versions
- ⚡ **Fast custom format**: Uses PostgreSQL's efficient custom format

### Manual Operations
- 📦 **Multiple backup types**: Custom, SQL, data-only, critical tables
- 🔍 **Easy listing**: See all available backups
- 🚀 **Quick restore**: One command to restore from any backup
- 📊 **Backup verification**: Automatic verification after restore
- 🛡️ **Safety backups**: Creates backup before restore operations

### Backup Types
1. **Custom Format** (`.backup`) - Recommended for restore operations
2. **SQL Dump** (`.sql`) - Human-readable, universal format
3. **Data-Only** (`.sql`) - Just the data, no schema
4. **Critical Tables** (`.sql`) - Essential data only (users, entities, reviews, etc.)

## 🚀 Quick Start

### Basic Usage
```bash
# Automatic backup before restart
./run.sh restart

# Manual backup (creates all formats)
./run.sh backup

# Quick backup (custom format only)
./run.sh backup custom

# List available backups
./run.sh list-backups

# Restore from backup
./run.sh restore ./backups/reviewsite_backup_custom_20231127_143000.backup
```

### Advanced Usage
```bash
# Create specific backup types
./run.sh backup full      # All formats
./run.sh backup custom    # Custom format only
./run.sh backup sql       # SQL dump only
./run.sh backup data      # Data only
./run.sh backup critical  # Critical tables only

# Restore with options
./run.sh restore --list                    # Show restore options
./run.sh restore --clean backup.sql        # Clean restore (drop existing data)
./run.sh restore --no-backup backup.sql    # Skip pre-restore backup
```

## 📁 Directory Structure

```
reviewsite/
├── backups/                    # All backup files stored here
│   ├── reviewsite_backup_custom_YYYYMMDD_HHMMSS.backup    # Custom format
│   ├── reviewsite_backup_sql_YYYYMMDD_HHMMSS.sql          # SQL dump
│   ├── reviewsite_backup_data_YYYYMMDD_HHMMSS.sql         # Data only
│   ├── reviewsite_backup_critical_YYYYMMDD_HHMMSS.sql     # Critical tables
│   ├── reviewsite_backup_metadata_YYYYMMDD_HHMMSS.txt     # Backup info
│   └── pre_restore/            # Safety backups before restore
└── scripts/
    ├── backup_database.sh      # Backup script
    └── restore_database.sh     # Restore script
```

## 🛡️ Data Protection Strategy

### What Gets Backed Up
- ✅ **All user data**: Users, profiles, authentication
- ✅ **All content**: Entities, reviews, comments, reactions
- ✅ **All categories**: Categories, subcategories, unified_categories
- ✅ **All relationships**: Connections, circles, notifications
- ✅ **All metadata**: Analytics, search history, progress
- ✅ **Database schema**: Tables, indexes, constraints, triggers

### Critical Tables (Always Protected)
- `users` - User accounts and authentication
- `user_profiles` - User profile information
- `entities` - All entities (businesses, professionals, etc.)
- `reviews` - All reviews and ratings
- `categories` & `subcategories` - Category system
- `unified_categories` - New unified category system

### Automatic Backup Triggers
- Before `./run.sh restart`
- Before `./run.sh rebuild`
- Before any restore operation (safety backup)

## 🔧 Recovery Scenarios

### Scenario 1: Accidental Data Loss
```bash
# List recent backups
./run.sh list-backups

# Restore from most recent backup
./run.sh restore ./backups/reviewsite_backup_custom_20231127_143000.backup
```

### Scenario 2: System Migration
```bash
# Create comprehensive backup
./run.sh backup full

# Move backup files to new system
# Restore on new system
./run.sh restore --clean ./backups/reviewsite_backup_sql_20231127_143000.sql
```

### Scenario 3: Development Reset
```bash
# Create backup of current state
./run.sh backup custom

# Reset to previous state
./run.sh restore ./backups/reviewsite_backup_custom_20231126_120000.backup
```

## ⚙️ Configuration

### Environment Variables
The backup system uses these environment variables from `.env`:
```bash
POSTGRES_USER=review_user
POSTGRES_PASSWORD=ReviewInn2024!SecurePass#Dev
POSTGRES_DB=review_platform
POSTGRES_HOST=db           # Use 'localhost' for direct connection
POSTGRES_PORT=5432
```

### Backup Settings
- **Retention**: Keeps last 20 backups automatically, deletes backups older than 5 versions
- **Location**: `./backups/` directory
- **Format**: Custom format (`.backup`) recommended for restore
- **Compression**: Automatic compression in custom format

## 🚨 Important Notes

### Before Restore
- ⚠️ **Always creates safety backup** before restore
- ⚠️ **Verify backup file** exists and is not corrupted
- ⚠️ **Stop application** before major restores

### Data Safety
- ✅ **Never deletes data** without confirmation
- ✅ **Always prompts** before destructive operations
- ✅ **Creates pre-restore backups** automatically
- ✅ **Verifies restore** success automatically

### Performance
- ⚡ **Custom format**: Fastest backup and restore
- 📦 **Compressed**: Saves disk space
- 🔄 **Incremental-friendly**: Works with volume snapshots

## 🔍 Troubleshooting

### Common Issues

#### Backup Fails
```bash
# Check database connectivity
docker exec postgres_db pg_isready -U review_user -d review_platform

# Check disk space
df -h

# Check permissions
ls -la ./backups/
```

#### Restore Fails
```bash
# Verify backup file
./run.sh restore --list

# Check backup file integrity
file ./backups/your_backup.backup

# Try different restore method
./run.sh restore --clean your_backup.sql  # For SQL files
```

#### Environment Issues
```bash
# Check environment variables
grep POSTGRES .env

# Test database connection
docker exec postgres_db psql -U review_user -d review_platform -c '\l'
```

### Getting Help
```bash
# Show backup options
./scripts/backup_database.sh

# Show restore options
./scripts/restore_database.sh --help

# Show main script options
./run.sh help
```

## 📋 Best Practices

### Regular Backups
1. **Before major changes**: Always backup before code deployments
2. **Before migrations**: Database schema changes
3. **Before updates**: System or dependency updates
4. **Weekly schedule**: Consider automated weekly backups

### Backup Testing
1. **Test restores**: Periodically test backup restoration
2. **Verify data**: Check restored data integrity
3. **Document process**: Keep recovery procedures updated

### Storage Management
1. **External storage**: Consider backing up to external systems
2. **Offsite backups**: For production systems
3. **Encryption**: For sensitive data
4. **Monitoring**: Set up backup monitoring alerts

## 🏆 Success Stories

With this backup system:
- ✅ **Never lose data** due to accidental operations
- ✅ **Quick recovery** from any data corruption
- ✅ **Easy system migration** between environments
- ✅ **Confident development** with safety net
- ✅ **Automated protection** without manual intervention

## 📞 Support

If you encounter any issues:
1. Check this documentation
2. Review error messages carefully
3. Verify database connectivity
4. Check disk space and permissions
5. Test with minimal backup/restore operations