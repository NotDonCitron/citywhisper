import json
import re
import os

def rebuild():
    print("🚀 Rebuilding Demo with original fidelity (Corrected Audio Mapping)...")
    
    # 1. Load the real route data
    with open('real_route.json', 'r', encoding='utf-16') as f:
        content = f.read()
        match = re.search(r'^\s*\{', content, re.MULTILINE)
        if not match:
            print("❌ Could not find valid JSON start")
            return
        json_text = content[match.start():content.rfind('}')+1].strip()
        route_data = json.loads(json_text)

    # 2. Build Precise Audio Map
    audio_dir = 'deploy_presentation/static/audio'
    audio_files = os.listdir(audio_dir)
    audio_map = {}
    for f in audio_files:
        if not f.endswith('.mp3'): continue
        
        persona = 'insider' if 'insider' in f else ('historian' if 'historian' in f else None)
        if not persona: continue

        if f.startswith('fence_'):
            # Format: fence_ID_PERSONA.mp3
            id_part = f.replace('fence_', '').split(persona)[0].strip('_')
            audio_map[f"fence_{id_part}_{persona}"] = f
        else:
            # Format: ID_PERSONA_HASH.mp3 or ID_PERSONA.mp3
            id_part = f.split(persona)[0].strip('_')
            audio_map[f"poi_{id_part}_{persona}"] = f

    # 3. Read Original Source
    with open('citywhisper_prototype.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 4. Strip Old Logic
    html = re.sub(r'const IS_STATIC_DEMO = .*?;', '', html)
    html = re.sub(r'const BACKEND_URL = .*?;', '', html)
    html = re.sub(r'const MOCK_MANNHEIM = .*?;', '', html)
    html = re.sub(r'async function runFullAutoTest\(\) \{.*?\}', '', html, flags=re.DOTALL)
    html = html.replace('else {\n                    addDebugLog("Fehler: Start-Overlay nicht erschienen", "error");\n                }\n            }, 3000);\n        }', '')

    # 5. Define New Interceptor (with NO f-string for the template)
    first_point = route_data['geometry']['coordinates'][0]
    
    js_template = """
        const IS_STATIC_DEMO = true;
        const BACKEND_URL = ".";
        const MOCK_MANNHEIM = [LON, LAT];
        const AUDIO_MAP = AMAP;

        if (IS_STATIC_DEMO) {
            const originalFetch = window.fetch;
            window.fetch = (url, options) => {
                const urlStr = url.toString();
                if (urlStr.includes('/pois') || urlStr.includes('/discover')) return originalFetch('./static/data/pois.json');
                if (urlStr.includes('/geofence/check')) return Promise.resolve(new Response(JSON.stringify({id: 'dist_quadrate', name: 'Mannheimer Quadrate'}), { headers: { 'Content-Type': 'application/json' } }));
                
                if (urlStr.includes('/poi/') && urlStr.includes('/audio')) {
                    const idMatch = urlStr.match(/\\/poi\\/([^/?]+)\\/audio/);
                    if (idMatch) {
                        const id = idMatch[1];
                        const persona = urlStr.includes('persona=historian') ? 'historian' : 'insider';
                        const mapKey = "poi_" + id + "_" + persona;
                        const audioFile = AUDIO_MAP[mapKey] || AUDIO_MAP["poi_" + id + "_insider"] || (id + "_insider_none.mp3");
                        const audioUrl = `./static/audio/${audioFile}`;
                        
                        const isPng = ['reiss_engelhorn_museen', 'rem'].includes(id);
                        const img = `./static/images/${id}.${isPng ? 'png' : 'jpg'}`;
                        
                        return (async () => {
                            let script = "Audio-Guide verfügbar.";
                            try { 
                                const res = await originalFetch(audioUrl.replace('.mp3', '.txt')); 
                                if (res.ok) script = await res.text(); 
                            } catch(e) {}
                            return new Response(JSON.stringify({ 
                                id, audio_url: audioUrl, script, type: 'poi', image: { cached: img, fallback: img } 
                            }), { headers: { 'Content-Type': 'application/json' } });
                        })();
                    }
                }
                
                if (urlStr.includes('/geofence/') && urlStr.includes('/audio')) {
                    const idMatch = urlStr.match(/\\/geofence\\/([^/?]+)\\/audio/);
                    if (idMatch) {
                        const id = idMatch[1];
                        const persona = urlStr.includes('persona=historian') ? 'historian' : 'insider';
                        const mapKey = "fence_" + id + "_" + persona;
                        const audioFile = AUDIO_MAP[mapKey] || `fence_${id}_insider.mp3`;
                        return (async () => {
                            let script = "Willkommen!";
                            try {
                                const res = await originalFetch(`./static/audio/${audioFile.replace('.mp3', '.txt')}`);
                                if (res.ok) script = await res.text();
                            } catch(e) {}
                            return new Response(JSON.stringify({ id, audio_url: `./static/audio/${audioFile}`, script, type: 'geofence' }), { headers: { 'Content-Type': 'application/json' } });
                        })();
                    }
                }
                
                if (urlStr.includes('/route')) {
                    return Promise.resolve(new Response(JSON.stringify(RDATA), { headers: { 'Content-Type': 'application/json' } }));
                }
                return originalFetch(url, options);
            };
        }
"""
    interceptor_js = js_template.replace('[LON, LAT]', str(first_point))
    interceptor_js = interceptor_js.replace('AMAP', json.dumps(audio_map))
    interceptor_js = interceptor_js.replace('RDATA', json.dumps(route_data))

    autotest_js = """
        async function runFullAutoTest() {
            if (typeof closeAll === 'function') closeAll();
            initApp();
            addDebugLog("Full Auto-Test gestartet...", "info");
            isMockingGps = true;
            updatePosition(MOCK_MANNHEIM[1], MOCK_MANNHEIM[0], 5);
            selectedPoiIds = ['wasserturm', 'schloss_mannheim', 'paradeplatz', 'marktplatz', 'jungbusch'];
            if (typeof renderPoiChips === 'function') renderPoiChips();
            if (typeof renderMarkers === 'function') renderMarkers();
            await generateRoute();
            setTimeout(() => {
                if (typeof startActiveTour === 'function') startActiveTour();
                setTimeout(runStressTest, 2000);
            }, 3500);
        }
"""

    # 6. Final Stitching
    new_html = html.replace('<script>', '<script>' + interceptor_js, 1)
    new_html = new_html.replace('loadData();', autotest_js + '\n        loadData();')
    new_html = new_html.replace('"/static/', '"./static/').replace("'/static/", "'./static/")
    new_html = new_html.replace('"/manifest.json"', '"./manifest.json"').replace('"/sw.js"', '"./sw.js"')

    with open('deploy_presentation/index.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    
    print(f"✅ Demo Fixed! Mapped {len(audio_map)} audio files.")

if __name__ == "__main__":
    rebuild()
