# .env File Management Guide

## Problem: Losing API Keys and Passwords

If you're experiencing issues where your API keys and email passwords keep getting lost, here's how to fix it permanently.

## Root Causes

1. **Scripts overwriting .env**: Some setup scripts might overwrite the entire `.env` file
2. **No backup mechanism**: If `.env` gets corrupted, there's no backup
3. **Manual editing errors**: Accidentally deleting keys when editing

## Solution: Use the Safe Update Script

We've created a safe `.env` file manager that:
- ✅ Preserves all existing keys when updating
- ✅ Creates automatic backups before changes
- ✅ Provides an interactive interface
- ✅ Never loses your API keys

## Quick Start

### Option 1: Interactive Manager (Recommended)

```bash
cd backend
python update_env.py
```

This will:
- Show your current configuration (with masked sensitive values)
- Let you update specific keys without losing others
- Create automatic backups
- Preserve all existing keys

### Option 2: Update Single Key Programmatically

```python
from update_env import update_env_key

# Update Google API Key
update_env_key('GOOGLE_API_KEY', 'your_new_key_here')

# Update Email Password
update_env_key('EMAIL_PASSWORD', 'your_new_password_here')
```

### Option 3: Manual Edit (Use with Caution)

If you must edit manually:
1. **Always backup first**:
   ```bash
   copy backend\.env backend\.env.backup
   ```

2. **Edit carefully** - only change the values, not the keys:
   ```env
   GOOGLE_API_KEY=your_actual_key_here  # ✅ Good - only changed value
   GOOGLE_API_KEY=your_actual_key_here   # ❌ Bad - removed the key
   ```

3. **Verify after editing**:
   ```bash
   python update_env.py
   # Select option 5 to view all keys
   ```

## Required Keys

Your `.env` file should have these keys (see `.env.example` for template):

### Required
- `GOOGLE_API_KEY` - For AI interviewer functionality

### Optional but Recommended
- `HEYGEN_API_KEY` - For avatar functionality
- `EMAIL_FROM` - Your email address
- `EMAIL_PASSWORD` - Your email App Password
- `SMTP_SERVER` - Email server (default: smtp.gmail.com)
- `SMTP_PORT` - Email port (default: 587)
- `ENABLE_EMAIL` - Enable email sending (default: true)

## Best Practices

1. **Use the update script**: Always use `update_env.py` instead of manual editing
2. **Check backups**: Backups are created automatically in `backend/.env.backup.*`
3. **Never commit .env**: The `.env` file is in `.gitignore` - never commit it
4. **Use .env.example**: Use `.env.example` as a template for new setups

## Troubleshooting

### "I lost my API keys again!"

1. Check for backups:
   ```bash
   dir backend\.env.backup.*
   ```

2. Restore from backup:
   ```bash
   copy backend\.env.backup.20251202_190000 backend\.env
   ```

3. Use the update script to verify:
   ```bash
   python update_env.py
   # Select option 5 to view all keys
   ```

### "The script overwrote my keys!"

The new `update_env.py` script **never** overwrites keys. If you used the old `setup_email.py`:
- It now uses the safe update method
- All keys are preserved
- Backups are created automatically

### "I can't find my .env file"

1. Check if it exists:
   ```bash
   dir backend\.env
   ```

2. If missing, create from template:
   ```bash
   copy backend\.env.example backend\.env
   ```

3. Then use the update script to add your keys:
   ```bash
   python update_env.py
   ```

## Prevention

To prevent losing keys in the future:

1. ✅ Always use `update_env.py` for updates
2. ✅ Never manually delete lines from `.env`
3. ✅ Check backups regularly
4. ✅ Keep a secure note of your API keys (password manager)
5. ✅ Use `.env.example` as reference

## File Locations

- **Main config**: `backend/.env` (your actual configuration)
- **Template**: `backend/.env.example` (template with placeholders)
- **Backups**: `backend/.env.backup.*` (automatic backups)
- **Git ignore**: `.gitignore` (ensures .env is never committed)

## Security Notes

- ⚠️ **Never commit `.env` to git** - it contains sensitive information
- ⚠️ **Never share your `.env` file** - it contains API keys and passwords
- ⚠️ **Use App Passwords** for email (not regular passwords)
- ⚠️ **Rotate keys regularly** if compromised

