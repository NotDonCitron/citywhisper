import json
import re

with open('real_route.json', 'r', encoding='utf-16') as f:
    text = f.read()
    # Strip DEBUG lines
    json_text = re.sub(r'^(DEBUG:.*?$)+', '', text, flags=re.MULTILINE).strip()
    data = json.loads(json_text)

with open('deploy_presentation/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

mock_code = f"""
                // 6. Route Calculation Mock
                if (urlStr.includes('/route')) {{
                    addDebugLog("DEMO: Nutze echte Mapbox Route für Mannheim", "info");
                    
                    const reqOrder = selectedPoiIds.length > 0 ? selectedPoiIds : ['wasserturm', 'paradeplatz'];
                    
                    // Return real path for the demo
                    if (reqOrder.length > 3) {{
                        return new Response(JSON.stringify({json.dumps(data)}), {{ headers: {{ 'Content-Type': 'application/json' }} }});
                    }}

                    // Fallback
                    let fullPath = [[MOCK_MANNHEIM[0], MOCK_MANNHEIM[1]]];
                    for (let i = 0; i < reqOrder.length; i++) {{
                        const poi = pois.find(p => String(p.id) === String(reqOrder[i]));
                        if (!poi) continue;
                        
                        const start = fullPath[fullPath.length - 1];
                        const end = [poi.lng, poi.lat];
                        
                        for (let j = 1; j <= 10; j++) {{
                            const ratio = j / 10;
                            const intermediate = [
                                start[0] + (end[0] - start[0]) * ratio,
                                start[1] + (end[1] - start[1]) * ratio
                            ];
                            if (j < 10) {{
                                intermediate[0] += (Math.random() - 0.5) * 0.0002;
                                intermediate[1] += (Math.random() - 0.5) * 0.0002;
                            }}
                            fullPath.push(intermediate);
                        }}
                    }}

                    return new Response(JSON.stringify({{
                        optimized_poi_order: reqOrder,
                        geometry: {{
                            type: "LineString",
                            coordinates: fullPath
                        }}
                    }}), {{ headers: {{ 'Content-Type': 'application/json' }} }});
                }}
"""

html = re.sub(r'// 6\. Route Calculation Mock.*?return originalFetch\(url, options\);', mock_code + '\n                return originalFetch(url, options);', html, flags=re.DOTALL)

with open('deploy_presentation/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Inject done.")
