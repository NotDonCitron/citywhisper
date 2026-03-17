import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("Kein GROQ_API_KEY in .env gefunden.")
else:
    print(f"Teste Groq Key: {api_key[:8]}...")
    client = Groq(api_key=api_key)
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "Erzähle mir einen kurzen Satz über den Wasserturm in Mannheim."}],
            temperature=0.8
        )
        print("Antwort:")
        print(completion.choices[0].message.content)
    except Exception as e:
        print(f"Fehler bei Groq: {e}")
