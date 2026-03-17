import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"Teste Key: {api_key[:8]}...")

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-2.0-flash')
    print("Sende Test-Prompt an gemini-2.0-flash...")
    response = model.generate_content("Erzähle mir einen kurzen Satz über den Wasserturm in Mannheim.")
    print("Antwort:")
    print(response.text)
except Exception as e:
    print(f"Fehler bei der Generierung: {e}")
