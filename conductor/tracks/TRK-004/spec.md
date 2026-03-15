# Specification: GPS & Geofencing (TRK-004)

## 🎯 Goal
Der Prototyp muss erkennen, wo sich der Nutzer befindet und Audio automatisch am richtigen Ort starten.

## 📝 Anforderungen
1. **PWA-Setup:**
   - Service Worker und Manifest für die Installation auf dem Handy hinzufügen.
2. **Geofencing Logik:**
   - JavaScript-Funktion zur Distanzberechnung (Haversine-Formel).
   - "WatchPosition" zur kontinuierlichen Verfolgung.
3. **Auto-Play Management:**
   - Handhabung von Browser-Restriktionen für Auto-Play (User-Geste notwendig).

## ✅ Erfolgskriterien
- [ ] Blauer Punkt (Nutzer-Position) bewegt sich auf der Karte.
- [ ] Audio startet von selbst, wenn der Nutzer in einen definierten Radius eintritt.
