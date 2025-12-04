#!/usr/bin/env python3
"""
Safe .env File Updater
This script safely updates .env file without losing existing keys.
"""

import os
from pathlib import Path
import shutil
from datetime import datetime

def backup_env_file(env_path):
    """Create a backup of .env file"""
    if env_path.exists():
        backup_path = env_path.parent / f".env.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        shutil.copy2(env_path, backup_path)
        print(f"✅ Backup created: {backup_path.name}")
        return backup_path
    return None

def read_env_file(env_path):
    """Read .env file and return as dictionary"""
    env_vars = {}
    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                # Skip comments and empty lines
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    return env_vars

def write_env_file(env_path, env_vars, comments=None):
    """Write .env file with proper formatting"""
    # Create backup first
    backup_env_file(env_path)
    
    # Organize variables by category
    api_keys = {}
    email_config = {}
    database_config = {}
    other_vars = {}
    
    for key, value in env_vars.items():
        if key in ['GOOGLE_API_KEY', 'HEYGEN_API_KEY']:
            api_keys[key] = value
        elif key in ['ENABLE_EMAIL', 'EMAIL_FROM', 'EMAIL_PASSWORD', 'SMTP_SERVER', 'SMTP_PORT']:
            email_config[key] = value
        elif key.startswith('DATABASE'):
            database_config[key] = value
        else:
            other_vars[key] = value
    
    with open(env_path, 'w', encoding='utf-8') as f:
        f.write("# Aptiva Backend Configuration\n")
        f.write("# This file contains sensitive information - DO NOT commit to git\n")
        f.write(f"# Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        # API Keys
        if api_keys:
            f.write("# API Keys\n")
            f.write("# Google Gemini API Key - Get from: https://makersuite.google.com/app/apikey\n")
            f.write(f"GOOGLE_API_KEY={api_keys.get('GOOGLE_API_KEY', '')}\n")
            if 'HEYGEN_API_KEY' in api_keys:
                f.write("# HeyGen API Key - Get from: https://www.heygen.com/\n")
                f.write(f"HEYGEN_API_KEY={api_keys.get('HEYGEN_API_KEY', '')}\n")
            f.write("\n")
        
        # Email Configuration
        if email_config:
            f.write("# Email Configuration\n")
            f.write("# For Gmail: Use App Password (not regular password)\n")
            f.write("# Get App Password: https://myaccount.google.com/apppasswords\n")
            f.write(f"ENABLE_EMAIL={email_config.get('ENABLE_EMAIL', 'true')}\n")
            f.write(f"EMAIL_FROM={email_config.get('EMAIL_FROM', '')}\n")
            f.write(f"EMAIL_PASSWORD={email_config.get('EMAIL_PASSWORD', '')}\n")
            f.write(f"SMTP_SERVER={email_config.get('SMTP_SERVER', 'smtp.gmail.com')}\n")
            f.write(f"SMTP_PORT={email_config.get('SMTP_PORT', '587')}\n")
            f.write("\n")
        
        # Database Configuration
        if database_config:
            f.write("# Database Configuration (Optional - defaults to SQLite)\n")
            for key, value in database_config.items():
                f.write(f"{key}={value}\n")
            f.write("\n")
        
        # Other variables
        if other_vars:
            f.write("# Other Configuration\n")
            for key, value in other_vars.items():
                f.write(f"{key}={value}\n")
    
    print(f"✅ .env file updated successfully!")

def update_env_key(key, value, env_path=None):
    """Safely update a single key in .env file"""
    if env_path is None:
        env_path = Path(__file__).parent / '.env'
    else:
        env_path = Path(env_path)
    
    # Read existing variables
    env_vars = read_env_file(env_path)
    
    # Update the key
    env_vars[key] = value
    
    # Write back
    write_env_file(env_path, env_vars)
    
    print(f"✅ Updated {key} in .env file")

def main():
    """Interactive .env updater"""
    env_path = Path(__file__).parent / '.env'
    
    print("=" * 60)
    print("Aptiva .env File Manager")
    print("=" * 60)
    print()
    
    # Read current .env
    env_vars = read_env_file(env_path)
    
    if not env_vars:
        print("⚠️  No existing .env file found. Creating new one...")
        print()
        print("Let's set up your configuration:")
        print()
        
        # Google API Key
        google_key = input("Enter your Google Gemini API Key (or press Enter to skip): ").strip()
        if google_key:
            env_vars['GOOGLE_API_KEY'] = google_key
        
        # HeyGen API Key
        heygen_key = input("Enter your HeyGen API Key (or press Enter to skip): ").strip()
        if heygen_key:
            env_vars['HEYGEN_API_KEY'] = heygen_key
        
        # Email Configuration
        print()
        print("Email Configuration (Optional):")
        enable_email = input("Enable email sending? (y/n, default: y): ").strip().lower()
        env_vars['ENABLE_EMAIL'] = 'true' if enable_email != 'n' else 'false'
        
        if env_vars['ENABLE_EMAIL'] == 'true':
            env_vars['EMAIL_FROM'] = input("Enter your email address: ").strip()
            env_vars['EMAIL_PASSWORD'] = input("Enter your email App Password: ").strip()
            env_vars['SMTP_SERVER'] = input("Enter SMTP server (default: smtp.gmail.com): ").strip() or 'smtp.gmail.com'
            env_vars['SMTP_PORT'] = input("Enter SMTP port (default: 587): ").strip() or '587'
    else:
        print("Current .env configuration:")
        print()
        for key, value in env_vars.items():
            # Mask sensitive values
            if 'PASSWORD' in key or 'KEY' in key:
                display_value = value[:4] + '*' * (len(value) - 4) if len(value) > 4 else '****'
            else:
                display_value = value
            print(f"  {key}={display_value}")
        print()
        
        print("Options:")
        print("1. Update Google API Key")
        print("2. Update HeyGen API Key")
        print("3. Update Email Configuration")
        print("4. Add/Update Other Key")
        print("5. View all keys")
        print("6. Exit")
        print()
        
        choice = input("Select option (1-6): ").strip()
        
        if choice == '1':
            new_key = input("Enter new Google API Key: ").strip()
            if new_key:
                env_vars['GOOGLE_API_KEY'] = new_key
        elif choice == '2':
            new_key = input("Enter new HeyGen API Key: ").strip()
            if new_key:
                env_vars['HEYGEN_API_KEY'] = new_key
        elif choice == '3':
            env_vars['EMAIL_FROM'] = input(f"Enter email address (current: {env_vars.get('EMAIL_FROM', '')}): ").strip() or env_vars.get('EMAIL_FROM', '')
            env_vars['EMAIL_PASSWORD'] = input("Enter email App Password: ").strip() or env_vars.get('EMAIL_PASSWORD', '')
            env_vars['SMTP_SERVER'] = input(f"Enter SMTP server (current: {env_vars.get('SMTP_SERVER', 'smtp.gmail.com')}): ").strip() or env_vars.get('SMTP_SERVER', 'smtp.gmail.com')
            env_vars['SMTP_PORT'] = input(f"Enter SMTP port (current: {env_vars.get('SMTP_PORT', '587')}): ").strip() or env_vars.get('SMTP_PORT', '587')
        elif choice == '4':
            key = input("Enter key name: ").strip()
            value = input("Enter value: ").strip()
            if key and value:
                env_vars[key] = value
        elif choice == '5':
            print()
            print("All keys in .env:")
            for key in sorted(env_vars.keys()):
                print(f"  - {key}")
            return
        elif choice == '6':
            return
    
    # Write updated .env
    write_env_file(env_path, env_vars)
    print()
    print("✅ Configuration saved!")
    print()
    print("Note: Restart your backend server for changes to take effect.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nOperation cancelled.")
    except Exception as e:
        print(f"\n❌ Error: {e}")

