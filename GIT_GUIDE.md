# Git Guide - Keeping Your Project Updated

## ✅ Project Successfully Linked!

Your project is now connected to: **https://github.com/narrren/MockAI_ProSculpt.git**

## Quick Commands

### Check Status
```powershell
git status
```

### Add All Changes
```powershell
git add .
```

### Commit Changes
```powershell
git commit -m "Description of your changes"
```

### Push to GitHub
```powershell
git push
```

### Pull Latest Changes (if working on multiple machines)
```powershell
git pull
```

## Common Workflow

### 1. Make Your Changes
- Edit files, add features, fix bugs

### 2. Check What Changed
```powershell
git status
git diff
```

### 3. Stage Your Changes
```powershell
git add .
# Or add specific files:
git add backend/main.py frontend/src/App.js
```

### 4. Commit with a Message
```powershell
git commit -m "Fixed Ollama model detection"
# Or more descriptive:
git commit -m "Fixed Ollama model detection

- Updated ai_interviewer.py to auto-detect llama3.2
- Added better error handling
- Improved model selection logic"
```

### 5. Push to GitHub
```powershell
git push
```

## Useful Git Commands

### View Commit History
```powershell
git log --oneline
```

### See What Files Changed
```powershell
git log --stat
```

### Undo Last Commit (keep changes)
```powershell
git reset --soft HEAD~1
```

### Discard Local Changes
```powershell
git checkout -- filename
# Or discard all:
git reset --hard HEAD
```

### Create a New Branch
```powershell
git checkout -b feature-name
```

### Switch Branches
```powershell
git checkout main
```

### Merge Branch
```powershell
git checkout main
git merge feature-name
```

## Keeping It Updated

### Daily Workflow
1. **Before starting work:**
   ```powershell
   git pull
   ```

2. **After making changes:**
   ```powershell
   git add .
   git commit -m "Your commit message"
   git push
   ```

### Weekly/Major Updates
```powershell
# Check status
git status

# See what changed
git diff

# Add and commit
git add .
git commit -m "Weekly update: [describe changes]"

# Push to GitHub
git push
```

## Important Notes

- **Never commit sensitive data** (passwords, API keys, etc.)
- **Always check `git status`** before committing
- **Write clear commit messages** describing what changed
- **Pull before pushing** if working on multiple machines
- **The `.gitignore` file** prevents committing unnecessary files (node_modules, __pycache__, etc.)

## Troubleshooting

### If push fails (remote has changes):
```powershell
git pull --rebase
git push
```

### If you need to force push (be careful!):
```powershell
git push --force
# Only use if you're sure!
```

### Check remote connection:
```powershell
git remote -v
```

## Quick Update Script

Save this as `UPDATE_GIT.ps1`:
```powershell
Write-Host "Updating Git repository..." -ForegroundColor Cyan
git add .
$message = Read-Host "Enter commit message"
git commit -m $message
git push
Write-Host "✅ Pushed to GitHub!" -ForegroundColor Green
```

Then run: `.\UPDATE_GIT.ps1`

