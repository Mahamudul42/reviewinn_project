-- Check for locks and active connections
SELECT 
    pid,
    usename,
    application_name,
    state,
    query,
    query_start
FROM pg_stat_activity 
WHERE datname = 'reviewinn_database'
AND state != 'idle'
ORDER BY query_start;
