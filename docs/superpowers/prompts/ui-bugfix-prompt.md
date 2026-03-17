# Bugfix Prompt für CityWhisper UI

## Kontext
Die neue Bottom-Navigation und das Profil-Modal wurden kürzlich implementiert, aber es gibt mehrere Bugs:

## Bugs die behoben werden müssen:

### 1. "Entdecken" Modal ist falsch zentriert
- Wenn man unten auf "Entdecken" (✨) klickt, öffnet sich das Modal, aber es ist falsch zentriert auf dem Bildschirm
- Das Modal sollte mittig auf dem Screen erscheinen, wie es vorher war

### 2. Tour-Button soll POIs vom aktuellen Standort anzeigen
- Wenn man auf "Tour" (🗺️) klickt, soll er nur Sehenswürdigkeiten vom aktuellen Ort anzeigen
- Aktuell zeigt er nichts an oder die POIs sind nicht anklickbar
- Die POIs sollen als Liste angezeigt werden, die man zur Tour hinzufügen kann

### 3. Profil-Fenster kann nicht geschlossen werden
- Das Profil-Modal (Preferences Modal) lässt sich nicht schließen
- Es fehlt entweder der Schließen-Button (✕) oder die Funktion funktioniert nicht
- Der User bleibt im Modal gefangen

### 4. Interessen werden nicht orange auf der Karte markiert
- Wenn man Interessen im Profil auswählt, sollten die entsprechenden POIs auf der Karte orange hervorgehoben werden
- Aktuell funktioniert diese Visualisierung nicht
- Die Karte sollte die ausgewählten Kategorien visuell anzeigen

### 5. Info-Button bei Auto-Play fehlt
- Bei "Auto-Play ⚡" im Profil fehlt ein Info-Button oder Tooltip
- Der User weiß nicht, was Auto-Play macht
- Es soll erklärt werden: "Automatisches Abspielen der Audio-Beiträge wenn du in der Nähe eines Ortes bist"

## Technische Details

**Relevante Datei:** `citywhisper_prototype.html`

**Zu untersuchen:**
- Die `switchTab()` Funktion (ca. Zeile 650)
- Das `discoveryModal` HTML (ca. Zeile 422)
- Das `preferencesModal` HTML (ca. Zeile 445)
- Die `toggleDiscovery()` und `togglePreferences()` Funktionen
- Die `selectCategory()` Funktion und wie sie mit der Karte interagiert

## Erwartetes Ergebnis
Alle 5 Bugs sollen behoben sein, sodass die App wieder voll funktionsfähig ist:
1. ✅ Entdecken Modal ist zentriert
2. ✅ Tour zeigt POIs vom aktuellen Standort
3. ✅ Profil-Fenster kann geschlossen werden
4. ✅ Ausgewählte Interessen werden orange auf der Karte angezeigt
5. ✅ Auto-Play hat einen Info-Button/Tooltip