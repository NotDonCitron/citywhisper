import pytest
import os
import asyncio
from main import generate_script
import edge_tts
from dotenv import load_dotenv

load_dotenv()

@pytest.mark.asyncio
async def test_groq_script_generation():
    """Verify that Groq (Llama-3.3-70b) generates a valid script for a Mannheim POI."""
    poi = {
        "id": "wasserturm",
        "name": "Mannheimer Wasserturm",
        "categories": ["History", "Architecture"]
    }
    
    script = await generate_script(poi, persona_id="insider", user_categories=["History"])
    
    assert script is not None
    assert len(script) > 20
    # Basic check for quality/content
    assert "Wasserturm" in script or "Mannheim" in script
    print(f"\nGenerated Script: {script}")

@pytest.mark.asyncio
async def test_edge_tts_audio_generation():
    """Verify that edge-tts can generate and save an MP3 file."""
    text = "Dies ist ein Test für CityWhisper in Mannheim."
    voice = "de-DE-StefanNeural"
    output_path = "test_output_audio.mp3"
    
    if os.path.exists(output_path):
        os.remove(output_path)
        
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)
    
    assert os.path.exists(output_path)
    assert os.path.getsize(output_path) > 1000 # Should be a valid MP3 file
    
    # Cleanup
    os.remove(output_path)

@pytest.mark.asyncio
async def test_image_proxy_logic():
    """Verify that the image proxy logic (Wikipedia search) works."""
    from main import search_wikipedia_image
    
    # Test with a well-known Mannheim POI
    img_url = search_wikipedia_image("Mannheimer Wasserturm")
    
    # Wikipedia might be flaky in CI, but should work for the Wasserturm
    if img_url:
        assert img_url.startswith("http")
        assert "upload.wikimedia.org" in img_url
        print(f"\nFound Image URL: {img_url}")
    else:
        pytest.skip("Wikipedia image search returned None (expected for some POIs or due to rate limiting)")
