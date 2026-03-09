import urllib.request
import json
import ssl

url = 'https://api.elevenlabs.io/v1/text-to-speech/pNInz6obbfDQGcgMyIGb'
headers = {
    'accept': 'audio/mpeg',
    'xi-api-key': 'sk_51d538fa7f460e75331f356b9cb574cf991e677e760a75a1',
    'Content-Type': 'application/json'
}
data = {
    'text': 'Da sind wir am Rijksmuseum! Kleiner Insider-Tipp: Die perfekten Fotos machst du von der Rückseite, wo der Garten ist.',
    'model_id': 'eleven_multilingual_v2',
    'voice_settings': {
        'stability': 0.5,
        'similarity_boost': 0.75
    }
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
context = ssl._create_unverified_context()

try:
    with urllib.request.urlopen(req, context=context) as response:
        with open('demo_audio.mp3', 'wb') as f:
            f.write(response.read())
    print('SUCCESS')
except Exception as e:
    print('ERROR:', str(e))
