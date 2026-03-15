# Nutze ein offizielles Python-Image
FROM python:3.11-slim

# Benutzer erstellen (Hugging Face Best Practice)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# Arbeitsverzeichnis setzen
WORKDIR /app

# System-Abhängigkeiten (als root installieren)
USER root
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
USER user

# Dateien kopieren und Abhängigkeiten installieren
COPY --chown=user backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Den Rest des Codes kopieren
COPY --chown=user . .

# Port für Hugging Face Spaces
EXPOSE 7860

# Start-Befehl
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
