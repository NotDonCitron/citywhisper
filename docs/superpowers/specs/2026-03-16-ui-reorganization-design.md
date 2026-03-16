# Design Spec: UI-Reorganisation & CityWhisper 2.0

## Problemstellung
Das aktuelle Interface von CityWhisper besteht aus vielen verteilten, fliegenden Buttons (Floating Action Buttons), die die Karte überladen und die Bedienung (besonders einhändig am Smartphone) erschweren. Es mangelt an einer klaren Hierarchie und Ordnung.

## Ziele
1.  **Zentralisierte Navigation:** Einführung einer Tab-Bar am unteren Rand für die wichtigsten Funktionen.
2.  **Aufgeräumte Karte:** Reduzierung der überlagerten UI-Elemente auf das Nötigste.
3.  **Strukturiertes Einstellungs-Menü:** Kategorisierung der Nutzerpräferenzen, Personas und Offline-Daten in einem einzigen, übersichtlichen Modal.
4.  **Mobile-First Design:** Optimierung der Touch-Zonen und Abstände.

## Vorgeschlagener Ansatz

### 1. Bottom-Navigation Bar
*   **Struktur:** Eine feste Leiste am unteren Bildschirmrand (z-index: 500).
*   **Tabs:**
    *   **Karte (📍):** Schließt alle Modals, Fokus auf die Map.
    *   **Entdecken (✨):** Öffnet das Discovery-Modal.
    *   **Tour (🗺️):** Öffnet den Route-Builder / Tour-Status.
    *   **Profil (👤):** Öffnet das neue, kombinierte Preferences-Modal.
*   **Design:** Glasmorphismus-Effekt (Semi-transparentes Dark-Navy mit Blur), aktiver Tab in `#0ea5e9` (Blau) hervorgehoben.

### 2. Kombiniertes Preferences-Modal ("Dashboard")
*   Zusammenführung von **Persona-Wahl**, **Kategorien** und **Offline-Daten**.
*   **Layout:**
    *   `Sektion 1:` Persona (Historiker vs. Insiderin) mit großen, klickbaren Karten.
    *   `Sektion 2:` Interessen (History, Art, etc.) als kompaktes Grid.
    *   `Sektion 3:` System-Einstellungen (Auto-Play, Audio-Master, Offline-Manager).

### 3. Schwebende Status-Anzeige (Oben)
*   Ein dezenter, schmaler Balken am oberen Rand zeigt nur:
    *   App-Logo (CityWhisper)
    *   Aktueller Status (Online/Offline)
    *   Aktive Persona (Icon-Indikator)

## Technische Umsetzung
*   **HTML/CSS:** Nutzung von Flexbox für die Tab-Bar. Anpassung des `z-index` Managements, um Überlagerungen zu vermeiden.
*   **JS-Logic:** Zentrale `switchTab(tabName)` Funktion, die Modals öffnet/schließt und den visuellen "Aktiv"-Status der Tabs setzt.

## Teststrategie
*   **Responsive Check:** Verifizierung des Layouts auf verschiedenen Bildschirmbreiten (Mobile/Desktop) via Chrome DevTools.
*   **Usability:** Prüfung der Klickwege (alle Funktionen müssen mit max. 2 Klicks erreichbar sein).

## Zeitplan
*   **Phase 1:** Implementierung der Basis-Tab-Bar und CSS-Anpassungen.
*   **Phase 2:** Umbau des Preferences-Modals zum kombinierten Dashboard.
*   **Phase 3:** Migration der Logik von den Floating-Buttons in die Tab-Bar.
