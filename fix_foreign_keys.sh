#!/bin/bash
# Script to fix all foreign key references to use new table names

echo "Fixing foreign key references to use new table names..."

# Find and replace users.user_id references
find /home/hasan181/personal/my_project/reviewinn_project/reviewinn-backend/models -name "*.py" -type f -exec sed -i 's/ForeignKey("users\.user_id"/ForeignKey("core_users.user_id"/g' {} \;

# Find and replace entities.entity_id references  
find /home/hasan181/personal/my_project/reviewinn_project/reviewinn-backend/models -name "*.py" -type f -exec sed -i 's/ForeignKey("entities\.entity_id"/ForeignKey("core_entities.entity_id"/g' {} \;

# Find and replace reviews.review_id references
find /home/hasan181/personal/my_project/reviewinn_project/reviewinn-backend/models -name "*.py" -type f -exec sed -i 's/ForeignKey("reviews\.review_id"/ForeignKey("review_main.review_id"/g' {} \;

echo "Foreign key references updated!"