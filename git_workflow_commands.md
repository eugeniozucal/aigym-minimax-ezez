# Proper Git Workflow Commands - History Preserving

## For EVERY commit going forward, use these exact commands:

### Step 1: Setup (only needed once per session)
```bash
cd /workspace
git config --global --add safe.directory /workspace
git config user.name "eugeniozucal"
git config user.email "eugeniozucal@example.com"
git remote set-url origin https://eugeniozucal:YOUR_GITHUB_TOKEN@github.com/eugeniozucal/aigym-minimax-ezez.git
```

### Step 2: For EACH commit (preserves history)
```bash
cd /workspace
git add .
git commit -m "Your descriptive commit message here"
git pull --rebase origin main
git push origin main
```

## Alternative if pull fails (backup method):
```bash
cd /workspace
git add .
git commit -m "Your descriptive commit message here"
git fetch origin main
git rebase origin/main
git push origin main
```

## Emergency method (if workspace git is corrupted):
```bash
cd /workspace
cp -r . /tmp/backup_workspace
cd /tmp/backup_workspace
rm -rf .git
git init
git branch -m main
git config user.name "eugeniozucal"
git config user.email "eugeniozucal@example.com"
git remote add origin https://eugeniozucal:YOUR_GITHUB_TOKEN@github.com/eugeniozucal/aigym-minimax-ezez.git
git add .
git commit -m "Your commit message here"
git pull --rebase origin main
git push origin main
cd /workspace
rm -rf .git
cp -r /tmp/backup_workspace/.git .
```

## Key Differences from --force method:
- ✅ `git pull --rebase origin main` - Gets remote changes first
- ✅ `git push origin main` - NO --force flag
- ✅ Preserves ALL commit history
- ✅ Includes token in URL (works reliably)