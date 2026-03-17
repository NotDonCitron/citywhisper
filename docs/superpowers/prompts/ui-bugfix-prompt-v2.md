# Bugfix Prompt für CityWhisper UI - Version 2

## Kontext
Die erste Runde Bugfixes wurde teilweise umgesetzt, aber es gibt noch 2 Probleme:

## Verbleibende Bugs:

### 1. "Entdecken" Modal ist am PC immer noch nicht zentriert
- Das Modal erscheint als Bottom-Sheet am unteren Rand
- **Erwartet:** Das Modal soll mittig auf dem Bildschirm erscheinen (zentriert, nicht unten)
- Das Modal hat die ID `#discoveryModal`
- CSS-Klasse `.app-modal` wird verwendet
- Es muss eine zentrierte Variante sein, nicht ein Bottom-Sheet

### 2. Tour POIs sind nicht anklickbar
- Wenn man auf "Tour" klickt, erscheint eine Liste von Orten
- Die POIs in der Liste sind aber nicht anklickbar
- Man kann sie nicht zur Tour hinzufügen
- **Erwartet:** Jeder POI in der Tour-Liste soll anklickbar sein und zur Route hinzugefügt werden können
- Die Liste wird in `#poiList` gerendert
- Es muss `onclick` Handler oder ähnliche Interaktion geben

## Technische Details
**Datei:** `citywhisper_prototype.html`

**CSS für zentriertes Modal:**
```css
.app-modal.centered {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 90%;
    max-height: 90vh;
}
```

**Für Tour-Liste:**
- Prüfe die `renderPoiList()` oder `updatePoiList()` Funktion
- Stelle sicher dass jeder POI-Button einen `onclick` Handler hat der `togglePoiInRoute(poiId)` aufruft

## Erwartetes Ergebnis
1. ✅ Das "Entdecken" Modal öffnet sich zentriert in der Mitte des Bildschirms (nicht als Bottom-Sheet)
2. ✅ Die POIs in der Tour-Liste sind anklickbar und können zur Route hinzugefügt werden
