# Google Gemini Setup Guide

## ✅ Migration Complete: Ollama → Google Gemini

The project has been successfully migrated from Ollama to Google Gemini!

## 🚀 Quick Setup

### 1. Get Your API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated API key

### 2. Configure the API Key

**Option A: Using .env file (Recommended)**

Create a file named `.env` in the `backend/` directory:

```bash
cd backend
echo GOOGLE_API_KEY=your_api_key_here > .env
```

**Option B: Environment Variable**

**Windows PowerShell:**
```powershell
$env:GOOGLE_API_KEY="your_api_key_here"
```

**Windows CMD:**
```cmd
set GOOGLE_API_KEY=your_api_key_here
```

**Linux/Mac:**
```bash
export GOOGLE_API_KEY=your_api_key_here
```

### 3. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install `google-generativeai` and `python-dotenv`.

### 4. Start the Backend

```bash
cd backend
# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows
# or
source venv/bin/activate     # Linux/Mac

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## ✅ Verify It's Working

1. **Check Backend Status:**
   Visit `http://localhost:8000/ai-status` in your browser.
   
   You should see:
   ```json
   {
     "current_model": "gemini-pro",
     "api_configured": true,
     "api_connected": true,
     "status": "ready",
     "provider": "Google Gemini"
   }
   ```

2. **Test the Chat:**
   - Open the frontend at `http://localhost:3000`
   - Try sending a message to the AI interviewer
   - You should get a response from Gemini!

## 🔄 What Changed?

### Removed:
- ❌ Ollama dependency
- ❌ Local model installation
- ❌ `check_ollama.py` script
- ❌ Ollama-specific error handling

### Added:
- ✅ Google Gemini API integration
- ✅ Environment variable support (`.env` file)
- ✅ Better error messages for API issues
- ✅ Cloud-based AI (no local model needed!)

## 📊 Benefits

1. **No Local Installation:** No need to download 4GB+ models
2. **Always Up-to-Date:** Uses latest Gemini models automatically
3. **Better Performance:** Cloud-based inference is faster
4. **Easier Setup:** Just need an API key, no model management

## ⚠️ Important Notes

1. **Internet Required:** Gemini requires an active internet connection
2. **API Quota:** Free tier has usage limits - check [Google Cloud Console](https://console.cloud.google.com/)
3. **API Key Security:** Never commit your `.env` file to Git (it's already in `.gitignore`)
4. **Cost:** Free tier is generous, but check pricing for heavy usage

## 🐛 Troubleshooting

### "API key not configured"
- Check that `.env` file exists in `backend/` directory
- Verify the API key has no extra spaces or quotes
- Try setting it as environment variable instead

### "API quota exceeded"
- Check your quota in [Google Cloud Console](https://console.cloud.google.com/)
- Free tier resets daily
- Consider upgrading if you need more usage

### "Connection error"
- Check your internet connection
- Verify Google services are accessible
- Check firewall/proxy settings

### "Invalid API key"
- Verify the key is correct (copy-paste again)
- Check if the key was revoked in Google Cloud Console
- Generate a new key if needed

## 📚 Additional Resources

- [Google AI Studio](https://makersuite.google.com/) - Get API keys and test models
- [Gemini API Documentation](https://ai.google.dev/docs) - Official docs
- [Pricing Information](https://ai.google.dev/pricing) - Check costs

## 🎉 You're All Set!

Your MockAI ProSculpt is now powered by Google Gemini! Start interviewing! 🚀

