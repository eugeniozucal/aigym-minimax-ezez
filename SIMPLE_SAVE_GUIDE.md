# 📋 SIMPLE GUIDE: How to Save Your Project Versions

## 🎯 **EVERY TIME you want to save a version, follow these 3 steps:**

---

### **STEP 1: Copy this entire block and paste it as one command**

```bash
cd /workspace && git config --global --add safe.directory /workspace && git config user.name "eugeniozucal" && git config user.email "eugeniozucal@example.com" && git remote set-url origin https://eugeniozucal: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@github.com/eugeniozucal/aigym-minimax-ezez.git && git add .
```

**What this does:** Sets up everything correctly (you don't need to understand it)

---

### **STEP 2: Copy this and CHANGE THE MESSAGE**

```bash
git commit -m "Describe what you changed here"
```

**IMPORTANT:** Replace `"Describe what you changed here"` with what you actually did.

**Examples:**
- `git commit -m "Fixed scrolling bug in canvas"`
- `git commit -m "Added new workout form"`
- `git commit -m "Changed button colors"`

---

### **STEP 3: Copy this entire block and paste it**

```bash
git pull --rebase origin main && git push origin main
```

**What this does:** Safely saves your version to GitHub preserving all history

---

## 🔥 **That's it! Your version is saved!**

### **Quick Reference - What to Copy Every Time:**

1. **Setup Command** (copy exactly):
```
cd /workspace && git config --global --add safe.directory /workspace && git config user.name "eugeniozucal" && git config user.email "eugeniozucal@example.com" && git remote set-url origin https://eugeniozucal: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@github.com/eugeniozucal/aigym-minimax-ezez.git && git add .
```

2. **Commit with your message** (change the message part):
```
git commit -m "Your description here"
```

3. **Save to GitHub** (copy exactly):
```
git pull --rebase origin main && git push origin main
```

## ✅ **What You'll See in GitHub:**
- Each save will show up as a separate commit
- You'll see the messages you wrote
- You can click on any commit to see what changed
- All your version history will be preserved

## ❌ **Never Use These Commands:**
- Anything with `--force` (destroys history)
- Any command you don't see in this guide