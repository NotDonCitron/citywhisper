# Specification: Backend & RAG Content Engine (TRK-002)

## 🎯 Goal
Erstellung eines Python-Backends, das zu jedem POI faktisch korrekte, aber unterhaltsame Tourguide-Skripte generiert.

## 📝 Anforderungen
1. **Fakten-Beschaffung:**
   - Integration der Wikipedia API oder Rijksmuseum API für POI-Daten.
2. **LLM Skript-Generierung:**
   - Nutzung von Gemini oder GPT-4o-mini zur Textgenerierung.
   - Definierte "Personas" (z.B. der humorvolle Guide, der Historiker).
3. **RAG-Integration:**
   - Sicherstellen, dass die KI keine Halluzinationen erzeugt, indem die externen Fakten als Prompt-Kontext mitgegeben werden.

## ✅ Erfolgskriterien
- [ ] Backend liefert auf Anfrage eine kurze, gut geschriebene Zusammenfassung zu einem POI zurück.
- [ ] Texte variieren je nach gewünschtem Tonfall.
