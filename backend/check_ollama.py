#!/usr/bin/env python3
"""
Helper script to check Ollama installation and available models
"""
import sys
import os

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    import ollama
    
    print("[OK] Ollama Python package is installed")
    
    try:
        # Try to connect to Ollama
        response = ollama.list()
        # Extract model names from the response
        if hasattr(response, 'models'):
            available_models = [model.model if hasattr(model, 'model') else str(model) for model in response.models]
        elif isinstance(response, dict):
            available_models = [model.get('name', model.get('model', str(model))) for model in response.get('models', [])]
        elif isinstance(response, list):
            available_models = [model.get('name', model.get('model', str(model))) if isinstance(model, dict) else (model.model if hasattr(model, 'model') else str(model)) for model in response]
        else:
            available_models = []
        
        if available_models:
            print(f"\n[OK] Ollama is running")
            print(f"\nAvailable models ({len(available_models)}):")
            for model in available_models:
                print(f"  - {model}")
            
            # Check for preferred models
            preferred = ["llama3", "llama3.2", "llama3.1", "llama2", "mistral"]
            found_preferred = [m for m in preferred if any(p in m for p in preferred)]
            
            if found_preferred:
                print(f"\n[OK] Found preferred model(s): {', '.join(found_preferred)}")
            else:
                print(f"\n[WARNING] No preferred models found. Recommended: ollama pull llama3")
        else:
            print("\n[WARNING] Ollama is running but no models are installed")
            print("  Install a model with: ollama pull llama3")
            
    except Exception as e:
        print(f"\n[ERROR] Cannot connect to Ollama: {e}")
        print("\nPlease ensure Ollama is running:")
        print("  - Windows/Mac: Start the Ollama application")
        print("  - Linux: Run 'ollama serve' in terminal")
        
except ImportError:
    print("[ERROR] Ollama Python package is not installed")
    print("  Install with: pip install ollama")
    sys.exit(1)

