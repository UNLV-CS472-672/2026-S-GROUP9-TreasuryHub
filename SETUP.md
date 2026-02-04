# TreasuryHub - Local Dev Setup

## Step 1: Install Node.js

### macOS

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify installation (should show v25.x or higher)
node --version
npm --version
```

### Linux (Ubuntu/Debian) & Windows WSL2

```bash
# Install Node.js 25.x LTS
curl -fsSL https://deb.nodesource.com/setup_25.x | sudo bash -
sudo apt install -y nodejs

# Verify installation (should show v25.x or higher)
node --version
npm --version
```

---

## Step 2: Install Git (if not already installed)

### macOS

```bash
# Usually pre-installed, but if not:
brew install git

# Verify
git --version
```

### Linux (Ubuntu/Debian) & Windows WSL

```bash
sudo apt-get update
sudo apt-get install -y git

# Verify
git --version
```

---

## Step 3: Clone and Setup Project

**All platforms (same commands):**

```bash
# Navigate to where you want the project
cd <wherever you keep your projects>

# Clone the repo with custom folder name
git clone https://github.com/UNLV-CS472-672/2026-S-GROUP9-TreasuryHub.git treasury_hub

# Enter the project directory
cd treasury_hub

# Install dependencies (this might take a minute)
npm install

# Copy environment variables
cp .env.example .env.local

# Open .env.local and verify it has the Supabase URL and anon key
# (They should already be there from .env.example)

# Start dev server
npm run dev
```

**Open browser:** http://localhost:3000

You should see the Next.js welcome page! ✅

---

## Step 4: Verify Everything Works

Run these commands to check your setup:

```bash
# Check Node version (should be 25+)
node --version

# Check npm version
npm --version

# Check Git version
git --version

# Start the dev server
npm run dev
```

If all commands work and localhost:3000 loads, you're done! 🎉

---

## Common Development Commands

```bash
# Start development server
npm run dev

# Stop server
Ctrl + C  (or Cmd + C on Mac)

# Build for production
npm run build

# Run linter to check code quality
npm run lint

# Install new packages
npm install package-name
```

---

## Git Workflow

**Important: Never work directly on the `main` branch!** Always create a feature branch.

### Starting New Work

```bash
# 1. Make sure you're on main and it's up to date
git checkout main
git pull origin main

# 2. Create a new branch for your feature
git checkout -b your-name-feature
# Example: git checkout -b danilo-login-page
```

### While Working on Your Feature

```bash
# See what files you've changed
git status

# Add all your changes
git add .

# Or add specific files
git add src/app/login/page.tsx

# Check git status again before a push to make sure you're not accidentally pushing changes you don't want. If it shows a file is staged that you don't actually want to push changes for, you can git rm --cached <filename>

# Commit your changes with a descriptive message
git commit -m "Add login page UI"

# Push your branch to GitHub
git push origin your-name-feature
```

### Creating a Pull Request

1. Go to GitHub: https://github.com/UNLV-CS472-672/2026-S-GROUP9-TreasuryHub
2. Click "Pull requests" → "New pull request"
3. Select your branch
4. Add a description of what you did
5. Request review from teammates
6. Wait for approval and merge

### After Your PR is Merged

```bash
# Switch back to main
git checkout main

# Get the latest changes (including your merged work)
git pull origin main
```

### Useful Git Commands

```bash
# See all branches
git branch

# See all branches including remote
git branch -a

# Switch to a different branch
git checkout branch-name

# See commit history
git log

# See commit history (one line per commit)
git log --oneline

# Undo changes to a file (before staging)
git checkout -- filename

# Reset a file back to what it was on main
git reset HEAD filename

# See who's working on what
git branch -a
```

### If Main Has Been Updated While You're Working

```bash
# Make sure your current work is committed first
git status
git add .
git commit -m "Your changes"

# Update main
git checkout main
git pull origin main

# Go back to your feature branch
git checkout your-name-feature

# Merge the latest main into your branch
git merge main

# If there are conflicts, fix them, then:
git add .
git commit -m "Merge main into feature branch"

# Push updated branch
git push origin your-name-feature
```

---

## Troubleshooting

### "npm: command not found" after installing Node
→ Close and reopen your terminal

### Git conflicts when merging
1. Open the conflicting files (Git will mark them with `<<<<<<<`, `=======`, `>>>>>>>`)
2. Choose which code to keep
3. Remove the conflict markers
4. Save the files
5. `git add .`
6. `git commit -m "Resolve merge conflicts"`

### Changes not showing up on localhost
→ Make sure the dev server is running (`npm run dev`)
→ Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
→ Check the terminal for errors

---
