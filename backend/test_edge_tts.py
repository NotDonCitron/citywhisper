import asyncio
import edge_tts

TEXT = "Hallo! Ich bin Stefan, dein Guide für Schönau. Wir stehen hier vor dem historischen Rathaus. Die Qualität dieser Stimme ist ziemlich beeindruckend, findest du nicht auch?"
VOICE = "de-DE-KillianNeural"
OUTPUT_FILE = "edge_test_stefan.mp3"

async def amain() -> None:
    communicate = edge_tts.Communicate(TEXT, VOICE)
    await communicate.save(OUTPUT_FILE)

if __name__ == "__main__":
    asyncio.run(amain())
