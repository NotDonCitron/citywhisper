import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"Teste Key: {api_key[:8]}...")

genai.configure(api_key=api_key)

try:
    print("Verfügbare Modelle:")
    models = genai.list_models()
    count = 0
    for m in models:
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
            count += 1
    if count == 0:
        print("Keine Modelle für 'generateContent' gefunden.")
except Exception as e:
    print(f"Fehler beim Abrufen der Modelle: {e}")
