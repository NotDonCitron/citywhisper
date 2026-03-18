import json
import re
import os

def build():
    # 1. Load the real route data
    with open('real_route.json', 'r', encoding='utf-16') as f:
        text = f.read()
        json_text = re.sub(r'^(DEBUG:.*?$)+', '', text, flags=re.MULTILINE).strip()
        route_data = json.loads(json_text)

    # 2. Read the high-quality source
    with open('citywhisper_prototype.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 3. Define the static interceptor
    # Note: We use raw strings or double braces to handle JS template literals in Python f-strings
    interceptor_code = """
        const IS_STATIC_DEMO = true;
        const BACKEND_URL = IS_STATIC_DEMO ? "." : window.location.origin;
        const MOCK_MANNHEIM = [8.4660, 49.4836];

        if (IS_STATIC_DEMO) {
            const originalFetch = window.fetch;
            window.fetch = async (url, options) => {
                const urlStr = url.toString();
                if (urlStr.includes('/pois') || urlStr.includes('/discover')) return originalFetch('./static/data/pois.json');
                if (urlStr.includes('/geofence/check')) return new Response(JSON.stringify({id: 'dist_quadrate', name: 'Mannheimer Quadrate'}), { headers: { 'Content-Type': 'application/json' } });
                
                if (urlStr.includes('/poi/') && urlStr.includes('/audio')) {
                    const id = urlStr.match(/\\/poi\\/([^/?]+)\\/audio/)[1];
                    const persona = urlStr.includes('persona=historian') ? 'historian' : 'insider';
                    const isPng = ['reiss_engelhorn_museen', 'rem'].includes(id);
                    const img = `./static/images/${id}.${isPng ? 'png' : 'jpg'}`;
                    let script = "Audio-Guide verfügbar.";
                    try { 
                        const res = await originalFetch(`./static/audio/poi_${id}_${persona}.txt`); 
                        if (res.ok) script = await res.text(); 
                    } catch(e) {}
                    return new Response(JSON.stringify({ 
                        id, 
                        audio_url: `./static/audio/poi_${id}_${persona}.mp3`, 
                        script, 
                        type: 'poi', 
                        image: { cached: img, fallback: img } 
                    }), { headers: { 'Content-Type': 'application/json' } });
                }
                
                if (urlStr.includes('/geofence/') && urlStr.includes('/audio')) {
                    const id = urlStr.match(/\\/geofence\\/([^/?]+)\\/audio/)[1];
                    const persona = urlStr.includes('persona=historian') ? 'historian' : 'insider';
                    return new Response(JSON.stringify({ 
                        id, 
                        audio_url: `./static/audio/fence_${id}_${persona}.mp3`, 
                        script: "Willkommen in Mannheim!", 
                        type: 'geofence' 
                    }), { headers: { 'Content-Type': 'application/json' } });
                }
                
                if (urlStr.includes('/route')) {
                    return new Response(JSON.stringify(""" + json.dumps(route_data) + """), { headers: { 'Content-Type': 'application/json' } });
                }
                return originalFetch(url, options);
            };
        }
    """

    # 4. Patch the HTML
    # Replace the backend URL line with our interceptor
    html = html.replace('const BACKEND_URL = window.location.origin;', interceptor_code)
    
    # Fix paths
    html = html.replace('"/static/', '"./static/')
    html = html.replace("'/static/", "'./static/")
    html = html.replace('"/manifest.json"', '"./manifest.json"')
    html = html.replace('"/sw.js"', '"./sw.js"')

    # Fix Auto-Test
    autotest_fix = """
        async function runFullAutoTest() {
            if (typeof closeAll === 'function') closeAll();
            initApp();
            addDebugLog("Full Auto-Test (Mannheim) gestartet...", "info");
            
            // Enable GPS Mock and force position to Schloss
            isMockingGps = true;
            updatePosition(MOCK_MANNHEIM[1], MOCK_MANNHEIM[0], 5);
            
            selectedPoiIds = ['schloss_mannheim', 'paradeplatz', 'wasserturm', 'marktplatz', 'jungbusch'];
            renderPoiChips();
            renderMarkers();
            
            await generateRoute();
            
            setTimeout(() => {
                startActiveTour();
                setTimeout(runStressTest, 1500);
            }, 3000);
        }
    """
    
    if 'async function runFullAutoTest()' in html:
        # Replace existing function
        html = re.sub(r'async function runFullAutoTest\(\) \{.*?\}', autotest_fix, html, flags=re.DOTALL)
    else:
        # Add before loadData
        html = html.replace('loadData();', autotest_fix + '\n        loadData();')

    # 5. Save the result
    with open('deploy_presentation/index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    
    print("Demo Build Complete! 🎯")

if __name__ == "__main__":
    build()
