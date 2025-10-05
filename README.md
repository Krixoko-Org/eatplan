# 7-Tage Ernährungsplan – Nierenstein-Prophylaxe

Dieses Projekt ist eine Webanwendung, die entwickelt wurde, um Benutzer bei der Vorbeugung von Nierensteinen (insbesondere Kalziumoxalatsteinen) durch eine oxalatarme Ernährung zu unterstützen.

## Funktionen

-   **7-Tage-Ernährungsplan:** Ein interaktiver Wochenplan mit oxalatarmen Mahlzeiten für Frühstück, Mittagessen, Abendessen und Snacks.
-   **Anpassbare Personenzahl:** Die Mengen in den Einkaufslisten können an die Anzahl der Personen angepasst werden.
-   **Wocheneinkaufsliste:** Generiert eine zusammengefasste Einkaufsliste für die gesamte Woche.
-   **Blog:** Enthält informative Artikel über Nierensteine, Ernährung und Prävention.
-   **Lexikon:** Ein Glossar, das wichtige Begriffe wie "Oxalat", "Purin" und "Citrat" einfach erklärt.
-   **Trink-Tracker:** Ein interaktives Tool auf der Startseite, um die tägliche Flüssigkeitsaufnahme zu verfolgen.
-   **Oxalat-Rechner:** Ein Rechner, mit dem Benutzer den Oxalatgehalt ihrer Mahlzeiten berechnen können.
-   **Dark/Light Mode:** Umschaltbares Design für eine angenehme Darstellung bei Tag und Nacht.
-   **Benachrichtigungen:** Optionale Browser-Benachrichtigungen zur Erinnerung an die Mahlzeiten.

## Wie man es benutzt

1.  Öffnen Sie die `index.html`-Datei in einem Webbrowser.
2.  Um die volle Funktionalität (insbesondere das Laden der Daten aus `data.json`) zu gewährleisten, wird empfohlen, die Seite über einen lokalen Webserver zu betreiben. Sie können einen einfachen Server mit dem folgenden Befehl im Projektverzeichnis starten:
    ```bash
    python -m http.server
    ```
3.  Navigieren Sie dann in Ihrem Browser zu `http://localhost:8000`.

## Dateistruktur

-   `index.html`: Die Hauptseite mit dem Ernährungsplan und dem Trink-Tracker.
-   `blog.html`: Die Übersicht der Blogartikel.
-   `blog-post-*.html`: Einzelne Blogartikel.
-   `lexikon.html`: Die Lexikon-Seite.
-   `rechner.html`: Die Seite mit dem Oxalat-Rechner.
-   `data.json`: Enthält alle Daten für den Ernährungsplan, das Lexikon und den Oxalat-Rechner.
-   `script.js`: Die JavaScript-Logik für die gesamte Anwendung.
-   `style.css`: Das Styling für die Anwendung.
-   `print.css`: Spezifische Styles für den Druck.