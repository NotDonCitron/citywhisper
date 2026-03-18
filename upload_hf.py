import os
from huggingface_hub import HfApi, create_repo

def upload_demo():
    token = os.getenv("HF_TOKEN")
    if not token:
        print("❌ Fehler: HF_TOKEN nicht in Umgebungsvariablen gefunden.")
        return

    api = HfApi(token=token)
    
    try:
        user = api.whoami()
        username = user['name']
        print(f"✅ Angemeldet als: {username}")
    except Exception as e:
        print(f"❌ Authentifizierung fehlgeschlagen: {e}")
        return

    repo_id = f"{username}/citywhisper-mannheim-demo"
    print(f"🚀 Erstelle/Prüfe Space: {repo_id}...")
    
    try:
        create_repo(
            repo_id=repo_id,
            token=token,
            repo_type="space",
            space_sdk="static",
            exist_ok=True
        )
        print(f"✅ Space bereit.")
    except Exception as e:
        print(f"⚠️ Hinweis bei Repo-Erstellung: {e}")

    print(f"📦 Lade Dateien aus 'deploy_presentation' hoch...")
    try:
        api.upload_folder(
            folder_path="deploy_presentation",
            repo_id=repo_id,
            repo_type="space",
            commit_message="Initial presentation upload"
        )
        print(f"🎉 Erfolg! Deine Demo ist live unter: https://huggingface.co/spaces/{repo_id}")
    except Exception as e:
        print(f"❌ Fehler beim Upload: {e}")

if __name__ == "__main__":
    upload_demo()
