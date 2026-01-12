#!/bin/bash
echo "🔧 Fixing Git push issues..."
cd /home/yenom/appWork/vehicle-service-management-app

echo "1. Checking current state..."
echo "   Current branch: $(git branch --show-current 2>/dev/null || echo 'None')"
echo "   Commit count: $(git rev-list --count HEAD 2>/dev/null || echo '0')"

# Create master branch if it doesn't exist
if ! git branch --list master; then
    echo "2. Creating master branch..."
    git checkout -b master
else
    echo "2. Switching to master branch..."
    git checkout master
fi

# Ensure we have a commit
if [ -z "$(git log --oneline -1 2>/dev/null)" ]; then
    echo "3. Creating initial commit..."
    git add .
    git commit -m "Initial commit: Complete Vehicle Service Management System
    
    Backend Features:
    - Express.js server with MySQL
    - JWT authentication
    - Vehicle management
    - Service tracking
    - Real-time notifications
    - Report generation
    
    Frontend Features:
    - React with Material-UI
    - Responsive dashboard
    - Vehicle management interface
    - Service scheduling
    - Real-time notifications"
fi

echo "4. Setting remote..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/Rufaro1964/VEHICLE-SERVICE-MANAGEMENT.git

echo "5. Pushing to GitHub..."
git push -u origin master --force

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo "📁 Check your repository: https://github.com/Rufaro1964/VEHICLE-SERVICE-MANAGEMENT"
else
    echo "❌ Push failed. Trying alternative approach..."
    
    # Try with main branch (GitHub default)
    git branch -m master main
    git push -u origin main --force
fi
