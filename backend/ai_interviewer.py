import ollama
import os


class InterviewerAI:
    def __init__(self, system_prompt_path=None):
        self.context = []  # Memory of the conversation
        self.model = None  # Will be set by _get_available_model
        self.model = self._get_available_model()  # Try to find an available model
        print(f"[InterviewerAI.__init__] Model set to: {self.model}")
        
        # Load system prompt from file if provided, otherwise use default
        if system_prompt_path and os.path.exists(system_prompt_path):
            with open(system_prompt_path, 'r', encoding='utf-8') as f:
                self.system_prompt = f.read()
        else:
            self.system_prompt = """
You are a Senior Technical Interviewer at ProSculpt. 
You are interviewing a Fresh Engineering Graduate.

Rules:
1. Ask one question at a time.
2. If I ask for a coding problem, give a Problem Statement.
3. If the user answers, evaluate it (Technical & Communication).
4. Be strict but encouraging.
5. Focus on fundamental concepts: Data Structures, Algorithms, System Design, and Programming Languages.
6. Provide constructive feedback on answers.
7. If the candidate asks for hints, provide subtle guidance without giving away the answer.
8. After each coding solution, ask about time complexity and space complexity.
"""

    def _get_available_model(self):
        """Try to find an available Ollama model"""
        # List of models to try in order of preference
        preferred_models = [
            "llama3",
            "llama3.2",
            "llama3.1",
            "llama2",
            "mistral",
            "phi3",
            "gemma2"
        ]
        
        try:
            # Try to list available models
            response = ollama.list()
            # Extract model names from the response
            if hasattr(response, 'models'):
                available_models = [model.model if hasattr(model, 'model') else str(model) for model in response.models]
            elif isinstance(response, dict):
                available_models = [model.get('name', model.get('model', str(model))) for model in response.get('models', [])]
            else:
                available_models = []
            
            # Find the first preferred model that's available
            # Models might have tags like "llama3.2:latest", so check if model name is in the available model string
            for preferred in preferred_models:
                for available in available_models:
                    # Check if model name matches (handles both "llama3.2" and "llama3.2:latest")
                    model_name = available.split(':')[0]  # Remove tag
                    if model_name == preferred:
                        print(f"Using Ollama model: {model_name}")
                        return model_name
            
            # If no preferred model found, use the first available
            if available_models:
                model_name = available_models[0].split(':')[0]  # Remove tag
                print(f"Using first available Ollama model: {model_name}")
                return model_name
            
            # If no models found, return default
            print("Warning: No Ollama models found. Using default 'llama3'. Please install a model.")
            return "llama3"
        except Exception as e:
            print(f"Warning: Could not list Ollama models: {e}")
            print("Using default 'llama3'. Make sure Ollama is running.")
            return "llama3"

    def chat(self, user_input):
        # Add user message to history
        self.context.append({'role': 'user', 'content': user_input})
        
        # Ensure we have a valid model
        if not self.model or self.model == "llama3":
            print(f"Warning: Model is '{self.model}', re-detecting...")
            self.model = self._get_available_model()
            print(f"Re-detected model: {self.model}")
        
        try:
            # Call Ollama
            print(f"Attempting to chat with model: {self.model}")
            response = ollama.chat(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': self.system_prompt},
                    *self.context
                ]
            )
            
            ai_reply = response['message']['content']
            self.context.append({'role': 'assistant', 'content': ai_reply})
            return ai_reply
        except Exception as e:
            # If model not found, try to re-detect available models
            error_str = str(e)
            print(f"Error with model '{self.model}': {error_str}")
            
            if "not found" in error_str.lower() or "404" in error_str:
                print(f"Model '{self.model}' not found, attempting to re-detect available models...")
                try:
                    # Re-detect available model
                    new_model = self._get_available_model()
                    print(f"Re-detected model: {new_model} (current was: {self.model})")
                    if new_model != self.model:
                        print(f"Switching from '{self.model}' to '{new_model}'")
                        self.model = new_model
                        # Retry with new model
                        print(f"Retrying chat with model: {self.model}")
                        response = ollama.chat(
                            model=self.model,
                            messages=[
                                {'role': 'system', 'content': self.system_prompt},
                                *self.context
                            ]
                        )
                        ai_reply = response['message']['content']
                        self.context.append({'role': 'assistant', 'content': ai_reply})
                        print(f"Successfully got response from {self.model}")
                        return ai_reply
                    else:
                        print(f"Re-detection returned same model: {new_model}")
                except Exception as retry_error:
                    print(f"Retry failed: {retry_error}")
                    import traceback
                    traceback.print_exc()
            
            # Error handling
            
            # Provide helpful error messages based on the error type
            if "not found" in error_str.lower() or "404" in error_str:
                # Model not found - try to suggest available models
                try:
                    response = ollama.list()
                    if hasattr(response, 'models'):
                        available = [model.model if hasattr(model, 'model') else str(model) for model in response.models]
                    elif isinstance(response, dict):
                        available = [model.get('name', model.get('model', str(model))) for model in response.get('models', [])]
                    else:
                        available = []
                    
                    if available:
                        models_list = ", ".join([m.split(':')[0] for m in available[:5]])  # Show first 5, remove tags
                        error_msg = f"Model '{self.model}' not found. Available models: {models_list}. The backend will auto-retry with an available model on the next request."
                    else:
                        error_msg = f"Model '{self.model}' not found. No models installed. Please install a model with: ollama pull llama3.2"
                except Exception as list_error:
                    error_msg = f"Model '{self.model}' not found. Please install it with: ollama pull llama3.2. Error: {list_error}"
            elif "connection" in error_str.lower() or "refused" in error_str.lower():
                error_msg = "Cannot connect to Ollama. Please ensure Ollama is running. Start it with: ollama serve"
            else:
                error_msg = f"Error: {error_str}. Please ensure Ollama is running and the model is installed."
            
            # Don't add error to context, just return it
            return error_msg

    def reset_context(self):
        """Reset the conversation context"""
        self.context = []

    def set_model(self, model_name):
        """Change the Ollama model"""
        self.model = model_name

