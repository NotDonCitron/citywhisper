import re
import os

def cleanup():
    path = 'deploy_presentation/index.html'
    if not os.path.exists(path):
        print(f"File {path} not found.")
        return

    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Remove all existing definitions of runFullAutoTest to avoid duplicates
    # We look for the pattern and remove it
    html = re.sub(r'async function runFullAutoTest\(\) \{.*?\}', '', html, flags=re.DOTALL)

    # The correct function for the demo
    correct_test = """
        async function runFullAutoTest() {
            if (typeof closeAll === "function") closeAll();
            initApp();
            addDebugLog("Full Auto-Test (Mannheim) gestartet...", "info");
            
            isMockingGps = true;
            // MOCK_MANNHEIM is defined as [lng, lat]
            if (typeof MOCK_MANNHEIM !== "undefined") {
                updatePosition(MOCK_MANNHEIM[1], MOCK_MANNHEIM[0], 5);
            }
            
            selectedPoiIds = ['schloss_mannheim', 'paradeplatz', 'wasserturm', 'marktplatz', 'jungbusch'];
            if (typeof renderPoiChips === "function") renderPoiChips();
            if (typeof renderMarkers === "function") renderMarkers();
            
            await generateRoute();
            
            setTimeout(() => {
                if (typeof startActiveTour === "function") startActiveTour();
                setTimeout(runStressTest, 1500);
            }, 3000);
        }
"""

    # Ensure we only have one script closing tag replacement
    if "</script>" in html:
        # Split at the last script tag
        parts = html.rsplit("</script>", 1)
        html = parts[0] + correct_test + "\n    </script>" + parts[1]

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print("Cleanup and correct function injection successful.")

if __name__ == "__main__":
    cleanup()
