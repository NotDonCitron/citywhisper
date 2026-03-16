# Design Spec: Frontend Hardening & Offline Management

## Problemstellung
Das Frontend der CityWhisper-App ist derzeit noch stark auf eine aktive Internetverbindung angewiesen und bietet bei der KI-Generierung von Inhalten (Audio/Skript) kein ausreichendes visuelles Feedback. Die Offline-Funktionalität beschränkt sich auf bereits besuchte Orte.

## Ziele
1.  **Aktives Offline-Management:** Nutzer sollen ganze Gebiete (Mannheim/Schönau) vorab herunterladen können.
2.  **Visual Feedback (AI Generation):** Eine klare, lebendige Signalisierung, wenn die KI gerade Inhalte generiert.
3.  **Robuste Bild-Integration:** Optimale Nutzung des neuen Backend-Bild-Proxys und Caches, um CORS-Fehler und fehlende Assets zu vermeiden.

## Vorgeschlagener Ansatz

### 1. Offline-Daten-Manager
*   **Integration:** Ein neuer Bereich im `preferencesModal` ("Offline-Daten").
*   **Funktionen:**
    *   Anzeige des Speicherverbrauchs (via `IndexedDB`-Schätzung).
    *   "Download"-Buttons für Mannheim und Schönau.
    *   **Progress UI:** Ein Fortschrittsbalken und ein Counter (z.B. "Lädt: 12/45 POIs") werden während des Downloads im Modal angezeigt.
    *   **Cleanup:** Ein "Daten löschen" Button ermöglicht das gezielte Leeren des Caches für eine Stadt.
    *   **Technik:** Bei Aktivierung iteriert das Frontend durch alle POIs der Stadt und triggert den `/poi/{id}/audio` Endpunkt. Das Backend generiert/liefert die Daten, und der Browser-Cache (Service Worker) speichert die Audio-Files und Bilder.

### 2. Audio-Loading & AI-State
*   **CSS-Animation:** Eine `.pulse-blue` Klasse für den `playPauseBtn`, die während des Ladens aktiv ist.
*   **Status-Update:** Dynamische Textänderung von "Bereit" zu "KI erzählt..." während des Downloads/Generierungsprozesses.
*   **Fehlerbehandlung:** 
    *   Integration eines 10-sekündigen Timeouts pro Versuch.
    *   Nach 3 fehlgeschlagenen Versuchen erscheint ein Toast-Element mit der Option "Nochmal versuchen" oder "Abbrechen". Der Button-Status kehrt zu "Bereit" (▶️) zurück.

### 3. Bild-Lade-Strategie
*   Das Frontend priorisiert in `loadPoiImage` die Felder `cached` und `proxied` des Backend-Antwort-Objekts.
*   Automatisches Pre-Loading von Bildern während des Offline-Downloads.

## Datenmodell & Schnittstellen
*   `IndexedDB` (Existing): 
    *   Erweiterung der `settings`-Store um `lastDownloadTime` pro Stadt.
    *   Implementierung einer `verifyOfflineAvailability(city)` Funktion, die stichprobenartig (oder vollständig) prüft, ob die Audio-Dateien für die POIs im Cache vorhanden sind, um den Button-Status ("Herunterladen" vs. "Aktualisieren") zu steuern.

## Teststrategie
*   **Unit Tests:** Erstellung von Tests für den `DownloadManager` (Iterierungslogik, Error-Handling, State-Transitions).
*   **Simulation:** Nutzung der Chrome DevTools (Network: Offline) zur Verifizierung der Cached-Audio-Funktion.
*   **Visuelle Prüfung:** Manuelles Triggering von langen Generierungszeiten (Mock-Delay im Backend), um die Puls-Animation zu prüfen.
*   **CORS-Check:** Verifizierung der Bildanzeige bei verschiedenen Quellen (Wikipedia, Unsplash) via Proxy.

## Zeitplan
*   **Phase 1:** UI-Anpassungen (Modal, Pulse-Effect).
*   **Phase 2:** Implementierung der Download-Iterierung & Progress-Tracking.
*   **Phase 3:** Integration der Bild-Proxy-Logik.
