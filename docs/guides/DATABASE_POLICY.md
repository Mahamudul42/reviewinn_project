# 🚨 DATABASE POLICY - CRITICAL READ BEFORE ANY DATABASE WORK

## ⚠️ NEVER USE SQLITE IN THIS PROJECT

This project uses **PostgreSQL ONLY**. SQLite usage will corrupt the data structure and break the application.

## 🔧 Required Database Configuration

### For Local Development:
```bash
DATABASE_URL=postgresql://review_user:review_password_123@localhost:5432/review_platform
```

### For Docker Environment:
```bash
DATABASE_URL=postgresql://review_user:review_password_123@db:5432/review_platform
```

## 📋 Before Making ANY Database Changes:

1. **ALWAYS verify database URL first:**
   ```bash
   cd reviewsite-backend
   python3 -c "from database import engine; print('Database URL:', engine.url)"
   ```

2. **Expected output should be:** `postgresql://...` **NEVER** `sqlite://...`

3. **If you see SQLite, STOP immediately and fix the configuration**

## 🗄️ Database Connection Details:
- **Host**: localhost (or `db` in Docker)
- **Port**: 5432
- **Database**: review_platform
- **Username**: review_user
- **Password**: review_password_123

## 🔍 How to Check PostgreSQL Status:
```bash
# Check if PostgreSQL is running
ps aux | grep postgres

# Check if listening on port 5432
lsof -i :5432

# Test connection
psql -h localhost -U review_user -d review_platform
```

## 🚫 What NOT to Do:
- ❌ Never create `.db` files
- ❌ Never use SQLite URLs in any configuration
- ❌ Never run seeding scripts without verifying PostgreSQL connection first
- ❌ Never ignore database connection errors

## ✅ What TO Do:
- ✅ Always use PostgreSQL for all environments
- ✅ Verify database URL before any operations
- ✅ Use existing PostgreSQL data
- ✅ Test connection before seeding/migrating

## 🔧 Common Fix Steps:

### If Backend is Using SQLite:
1. Check `reviewsite-backend/.env` 
2. Ensure `DATABASE_URL` points to PostgreSQL
3. Remove any `.db` files: `rm -f reviewsite-backend/*.db`
4. Restart the backend server
5. Verify with the database URL check above

### If PostgreSQL Connection Fails:
1. Ensure PostgreSQL service is running
2. Check port 5432 is available
3. Verify credentials match the configuration
4. Test manual connection with psql

## 📊 Project Database Status:
- **Production Ready**: PostgreSQL with real user data
- **Development**: PostgreSQL with comprehensive test data
- **Never Use**: SQLite (corrupts project structure)

## 🆘 Emergency Recovery:
If SQLite was accidentally used:
1. Stop all backend processes
2. Remove all `.db` files
3. Fix DATABASE_URL configuration
4. Restart with PostgreSQL
5. Verify data integrity

---
**Remember: This project has REAL PostgreSQL data. Protect it!** 