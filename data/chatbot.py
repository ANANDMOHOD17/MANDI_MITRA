"""
Smart Mandi - AI Agricultural Chatbot Assistant (Kisan Sahayak)
Provides intelligent answers to farmer, trader, and user queries related to:
- Real-time and historical crop prices (Wheat, Rice, Cotton, Mustard, Onion, Tomato, Potato, etc.)
- Net return, transport logistics, and commission calculation formulas
- Price Advisor navigation & step-by-step usage
- Market Atlas geospatial features (heatmaps, clusters)
- Live AGMARKNET / Data.gov.in price feeds
- Government MSP benchmarks & policies
- Multi-language support (English, Hindi, Marathi, Telugu, Punjabi, Gujarati)
"""

import re
import math
from datetime import datetime

# Multilingual Commodity Aliases Dictionary
COMMODITY_ALIASES = {
    'wheat': ['wheat', 'gehu', 'gehun', 'गेहूं', 'गहू', 'గోధుమలు', 'ਕਣਕ', 'ઘઉં'],
    'rice': ['rice', 'paddy', 'chawal', 'dhan', 'चावल', 'धान', 'भात', 'తాండ్ర', 'బియ్యం', 'ਚੌਲ', 'ડાંગર', 'ચોખા'],
    'cotton': ['cotton', 'kapas', 'रूई', 'कपास', 'कापूस', 'పత్తి', 'ਕਪਾਹ', 'કપાસ'],
    'mustard': ['mustard', 'sarson', 'rai', 'सरसों', 'मोहरी', 'ఆవాలు', 'ਸਰ੍ਹੋਂ', 'રાઈ'],
    'onion': ['onion', 'pyaz', 'pyaaz', 'kanda', 'प्याज', 'कांदा', 'कांद्या', 'कांद्याचे', 'कांद्याचा', 'ఉల్లిపాయ', 'ਪਿਆਜ਼', 'ડુંગળી'],
    'potato': ['potato', 'aloo', 'alu', 'बटाटा', 'आलू', 'బంగాళాదుంప', 'ਆਲੂ', 'બટાકા'],
    'tomato': ['tomato', 'tamatar', 'टमाटर', 'टोमॅटो', 'టమోటా', 'ਟਮਾਟਰ', 'ટામેટા'],
    'soybean': ['soybean', 'soya', 'सोयाबीन', 'సోయాబీన్', 'ਸੋਇਆਬੀਨ', 'સોયાબીન'],
    'chana': ['chana', 'gram', 'chickpea', 'चना', 'हरभरा', 'శనగలు', 'ਛੋਲੇ', 'ચણા'],
    'tur': ['tur', 'arhar', 'pigeon pea', 'अरहर', 'तूर', 'కందులు', 'ਤੂਰ', 'તુવેર'],
    'moong': ['moong', 'mung', 'मूंग', 'मूग', 'పెసలు', 'ਮੂੰਗ', 'મગ'],
    'maize': ['maize', 'corn', 'makka', 'मक्का', 'मका', 'మొక్కజొన్న', 'ਮੱਕੀ', 'મકાઈ'],
    'garlic': ['garlic', 'lahsun', 'लहसुन', 'लसूण', 'వెల్లుల్లి', 'ਲਸਣ', 'લસણ'],
    'ginger': ['ginger', 'adrak', 'अदरक', 'आले', 'అల్లం', 'ਅਦਰਕ', 'આદુ']
}

def detect_language(text, fallback_lang='en'):
    """Detect if text contains Devanagari or other Indic scripts, or use fallback."""
    if re.search(r'[\u0C00-\u0C7F]', text):
        return 'te'
    if re.search(r'[\u0A00-\u0A7F]', text):
        return 'pa'
    if re.search(r'[\u0A80-\u0AFF]', text):
        return 'gu'
    if re.search(r'[\u0900-\u097F]', text):
        # Heuristic between Marathi and Hindi
        if any(w in text.lower() for w in ['आहे', 'नाही', 'कसा', 'नफा', 'शेतकरी', 'द्या', 'करा', 'काय', 'बाजार']):
            return 'mr'
        return 'hi'
    return fallback_lang if fallback_lang in ['en', 'hi', 'mr', 'te', 'pa', 'gu'] else 'en'

def find_commodity_in_text(text, commodities_list):
    """Identify if any commodity is mentioned in user query using word boundaries."""
    text_lower = text.lower()
    for comm_key, aliases in COMMODITY_ALIASES.items():
        for alias in aliases:
            # Check with word boundary
            pattern = r'(?:\b|^)' + re.escape(alias) + r'(?:\b|$)'
            if re.search(pattern, text_lower):
                # Find matching commodity in db commodities
                for c in commodities_list:
                    c_name_lower = c.get('name', '').lower()
                    if comm_key in c_name_lower or any(a in c_name_lower for a in aliases[:2]):
                        return c
    # Direct match with whole commodity names
    for c in commodities_list:
        c_name = c.get('name', '').lower()
        if re.search(r'(?:\b|^)' + re.escape(c_name) + r'(?:\b|$)', text_lower):
            return c
    return None

def get_commodity_summary_data(comm, db):
    """Compute latest stats for the given commodity from db."""
    comm_id = comm.get('id')
    prices = [p for p in db.get('prices', []) if p.get('commodity_id') == comm_id]
    
    if not prices:
        return None
        
    # Get latest date
    sorted_prices = sorted(prices, key=lambda x: x.get('date', ''), reverse=True)
    latest_date = sorted_prices[0].get('date')
    latest_records = [p for p in sorted_prices if p.get('date') == latest_date]
    
    if not latest_records:
        latest_records = sorted_prices[:20]
        
    modal_prices = [p.get('modal_price', 0) for p in latest_records if p.get('modal_price', 0) > 0]
    avg_price = round(sum(modal_prices) / len(modal_prices)) if modal_prices else 0
    max_rec = max(latest_records, key=lambda x: x.get('modal_price', 0))
    min_rec = min(latest_records, key=lambda x: x.get('modal_price', 0))
    
    # Map market names
    markets_map = {m.get('id'): m for m in db.get('markets', [])}
    max_market = markets_map.get(max_rec.get('market_id'), {})
    min_market = markets_map.get(min_rec.get('market_id'), {})
    
    return {
        'commodity_name': comm.get('name'),
        'msp': comm.get('msp'),
        'avg_price': avg_price,
        'date': latest_date,
        'highest_price': max_rec.get('modal_price'),
        'highest_market': max_market.get('name', 'N/A'),
        'highest_state': max_market.get('state', 'N/A'),
        'lowest_price': min_rec.get('modal_price'),
        'lowest_market': min_market.get('name', 'N/A'),
        'lowest_state': min_market.get('state', 'N/A'),
        'total_markets': len(latest_records)
    }

def answer_query(message, language='en', db=None, live_data_func=None):
    """
    Main chatbot reasoning pipeline.
    Returns dict: {
        'reply': str (markdown-enabled),
        'suggestions': list of str,
        'topic': str
    }
    """
    if not message or not message.strip():
        return {
            'reply': "Namaste! How can I help you today with mandi prices, net return calculations, or market navigation?",
            'suggestions': ["🌾 Wheat Price Today", "🚛 How is Net Return calculated?", "📍 Find Best Mandi"],
            'topic': 'empty'
        }

    msg = message.strip()
    msg_lower = msg.lower()
    
    # Detect language if Indic script present, or honor user-selected language
    lang = detect_language(msg, fallback_lang=language)
    
    commodities = db.get('commodities', []) if db else []
    
    # -------------------------------------------------------------
    # 1. GREETING / INTRO
    # -------------------------------------------------------------
    greetings = ['hi', 'hello', 'hey', 'namaste', 'namaskar', 'hlo', 'नमस्ते', 'नमस्कार', 'प्रणाम', 'నమస్కారం', 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ', 'નમસ્તે']
    if any(re.search(r'\b' + re.escape(g) + r'\b', msg_lower) for g in greetings) and len(msg.split()) <= 4:
        if lang == 'hi':
            reply = """🙏 **नमस्ते! मैं स्मार्ट मंडी सहायक (Kisan AI) हूँ।**

मैं भारतीय किसानों, व्यापारियों और मंडी उपयोगकर्ताओं की इन विषयों में सहायता कर सकता हूँ:
• 🌾 **दैनिक मंडी भाव व एगमार्कनेट लाइव रेट्स**
• 🚛 **शुद्ध मुनाफे की सटीक गणना (परिवहन व कमीशन काटकर)**
• 🗺️ **मार्केट एटलस और हीटमैप मानचित्र**
• 🇮🇳 **सरकारी न्यूनतम समर्थन मूल्य (MSP)**

आप मुझसे नीचे दिए गए किसी भी सुझाव पर क्लिक करके या सीधे प्रश्न पूछकर शुरुआत कर सकते हैं!"""
        elif lang == 'mr':
            reply = """🙏 **नमस्कार! मी स्मार्ट कृषी बाजार सहाय्यक (Kisan AI) आहे.**

मी शेतकरी आणि व्यापारी बांधवांना खालील विषयांवर मार्गदर्शन करतो:
• 🌾 **आजचे थेट व बाजार समिती दर**
• 🚛 **खर्च व वाहतूक वजा जाता मिळणारा प्रत्यक्ष नफा**
• 🗺️ **महाराष्ट्र व देशपातळीवरील बाजार नकाशा (Atlas)**
• 🇮🇳 **किमान आधारभूत किंमत (MSP)**

खालील पर्यायांवर क्लिक करा किंवा थेट प्रश्न विचारा!"""
        elif lang == 'te':
            reply = """🙏 **నమస్కారం! నేను స్మార్ట్ మండి ఏఐ సహాయకుడిని.**

రైతులకు మరియు వ్యాపారులకు ఈ క్రింది సమాచారం అందిస్తాను:
• 🌾 **నేటి మార్కెట్ మరియు లైవ్ రేట్లు**
• 🚛 **రవాణా మరియు కమిషన్ పోను వచ్చే నికర లాభం లెక్కలు**
• 🗺️ **మార్కెట్ అట్లాస్ మరియు మ్యాప్ వివరాలు**
• 🇮🇳 **కనీస మద్దతు ధర (MSP)**

దయచేసి మీ ప్రశ్న అడగండి!"""
        else:
            reply = """👋 **Namaste! I am your Smart Mandi AI Assistant (Kisan Sahayak).**

I can help you with:
• 🌾 **Today's Mandi Prices & Live AGMARKNET Rates** across all states
• 🚛 **Accurate Net Return Calculation** (Gross Price − Transport − Commission)
• 🗺️ **Interactive Market Atlas** with price heatmaps & clusters
• 🇮🇳 **Government MSP Benchmarks** (Minimum Support Price)
• 📍 **Finding the Most Profitable Mandi** from your farm

Feel free to ask a question or tap any suggested prompt below!"""

        return {
            'reply': reply,
            'suggestions': [
                "🌾 Today's Wheat Price",
                "🚛 How is Net Return calculated?",
                "📍 How to find best mandi?",
                "🗺️ What is Market Atlas?",
                "🇮🇳 What is MSP benchmark?"
            ],
            'topic': 'greeting'
        }

    # -------------------------------------------------------------
    # 2. SPECIFIC COMMODITY PRICE LOOKUP
    # -------------------------------------------------------------
    matched_comm = find_commodity_in_text(msg, commodities)
    price_keywords = ['price', 'rate', 'bhav', 'भाव', 'दर', 'కిమ్మత్తు', 'ਕੀਮਤ', 'કિંમત', 'cost', 'modal', 'aaj', 'today']
    is_price_query = any(k in msg_lower for k in price_keywords) or matched_comm is not None

    if matched_comm and is_price_query:
        summary = get_commodity_summary_data(matched_comm, db)
        if summary:
            cname = summary['commodity_name']
            avg = summary['avg_price']
            msp = summary['msp']
            h_mandi = summary['highest_market']
            h_state = summary['highest_state']
            h_price = summary['highest_price']
            l_mandi = summary['lowest_market']
            l_state = summary['lowest_state']
            l_price = summary['lowest_price']
            
            msp_badge = f"₹{msp}/Qtl" if msp else "N/A"
            diff_msp = f"(+₹{avg - msp} above MSP)" if (msp and avg >= msp) else (f"(-₹{msp - avg} below MSP)" if msp else "")

            if lang == 'hi':
                reply = f"""🌾 **{cname} का ताज़ा मंडी भाव विवरण:**

• **राष्ट्रीय औसत भाव:** ₹{avg:,} / क्विंटल {diff_msp}
• **सरकारी एमएसपी (MSP):** {msp_badge}
• 🏆 **सर्वोच्च भाव वाली मंडी:** **{h_mandi}** ({h_state}) — **₹{h_price:,}** / क्विंटल
• 📉 **न्यूनतम भाव वाली मंडी:** **{l_mandi}** ({l_state}) — **₹{l_price:,}** / क्विंटल
• **मूल्य अंतर (Price Spread):** ₹{h_price - l_price:,} / क्विंटल

💡 *सलाह: उच्चतम भाव वाली मंडी हमेशा सबसे अधिक लाभदायक नहीं होती। अपनी दूरी और परिवहन दर डालकर **Price Advisor** पर वास्तविक शुद्ध मुनाफा (Net Return) जाँचें।*"""
            elif lang == 'mr':
                reply = f"""🌾 **{cname} चे बाजार समिती दर विश्लेषण:**

• **राष्ट्रीय सरासरी भाव:** ₹{avg:,} / क्विंटल {diff_msp}
• **हमीभाव (MSP):** {msp_badge}
• 🏆 **सर्वाधिक भाव देणारी बाजार समिती:** **{h_mandi}** ({h_state}) — **₹{h_price:,}** / क्विंटल
• 📉 **किमान भाव देणारी बाजार समिती:** **{l_mandi}** ({l_state}) — **₹{l_price:,}** / क्विंटल
• **दरांमधील तफावत (Spread):** ₹{h_price - l_price:,} / क्विंटल

💡 *टीप: जास्त भाव देणारी मंडी दूर असल्यास वाहतूक खर्च वाढतो. **Price Advisor** वापरून निव्वळ नफा (Net Return) नक्की तपासा.*"""
            else:
                reply = f"""🌾 **Market Price Report for {cname}:**

• **National Average Modal Price:** **₹{avg:,} / Quintal** {diff_msp}
• **Government MSP Benchmark:** **{msp_badge}**
• 🏆 **Top Paying Mandi:** **{h_mandi}** ({h_state}) at **₹{h_price:,} / Qtl**
• 📉 **Lowest Mandi Rate:** **{l_mandi}** ({l_state}) at **₹{l_price:,} / Qtl**
• **Inter-market Price Spread:** **₹{h_price - l_price:,} / Qtl**

💡 *Smart Tip: A mandi with the highest quoted price might not give you the highest net profit due to longer transit distance! Use the **Price Advisor** to compute your exact Net Return after deducting diesel and commission fees.*"""

            return {
                'reply': reply,
                'suggestions': [
                    f"🚛 Transport cost for {cname}",
                    "📍 Find Best Mandi",
                    "🗺️ View on Market Atlas",
                    "🌾 Today's Mustard Price"
                ],
                'topic': 'commodity_price'
            }

    # -------------------------------------------------------------
    # 3. NET RETURN & FORMULA CALCULATION
    # -------------------------------------------------------------
    net_return_keywords = ['net return', 'formula', 'calculate', 'how is net return', 'math', 'deduction', 'haversine', 
                          'मुनाफा', 'शुद्ध मुनाफा', 'गणना', 'कैलकुलेट', 'नफा', 'हिशोब', 'వాపసు', 'లాభం']
    if any(k in msg_lower for k in net_return_keywords):
        if lang == 'hi':
            reply = """🚛 **स्मार्ट मंडी शुद्ध मुनाफे (Net Return) की गणना का फॉर्मूला:**

स्मार्ट मंडी केवल मंडी का भाव नहीं देखती, बल्कि खेत से मंडी तक का पूरा खर्च घटाकर वास्तविक लाभ निकालती है:

$$\\text{सकल आय (Gross Revenue)} = \\text{मंडी भाव} \\times \\text{फसल मात्रा (क्विंटल)}$$
$$\\text{परिवहन खर्च (Transport Cost)} = \\text{दूरी (किमी)} \\times \\text{दर (₹/किमी/क्विंटल)} \\times \\text{मात्रा}$$
$$\\text{मंडी कमीशन व शुल्क} = \\text{सकल आय} \\times \\text{कमीशन दर (उदा. 2.0%)}$$
$$\\mathbf{शुद्ध\\,मुनाफा\\,(Net\\,Return)} = \\mathbf{सकल\\,आय - (परिवहन\\,खर्च + कमीशन\\,शुल्क)}$$

### 📍 दूरी की गणना (Haversine Formula):
हम आपके खेत के अक्षांश-देशांतर (Latitude/Longitude) और मंडी के बीच पृथ्वी की वक्रता को मापकर सटीक किलोमीटर दूरी निकालते हैं।

✨ **उदाहरण:**
यदि मंडी A में भाव ₹2,600 है लेकिन वह 120 किमी दूर है, और मंडी B में भाव ₹2,500 है लेकिन वह केवल 15 किमी दूर है — तो **मंडी B आपको ₹5,000 से ₹8,000 अधिक शुद्ध मुनाफा** दे सकती है!"""
        elif lang == 'mr':
            reply = """🚛 **निव्वळ नफा (Net Return) काढण्याचे गणितीय सूत्र:**

स्मार्ट मंडी केवळ बाजारभाव न पाहता, वाहतूक व दलाली खर्च वजा करून प्रत्यक्ष शेतकऱ्याच्या हातात पडणारा नफा दाखवते:

$$\\text{एकूण महसूल} = \\text{बाजार भाव} \\times \\text{शेतमालाचे वजन (क्विंटल)}$$
$$\\text{वाहतूक खर्च} = \\text{अंतर (किमी)} \\times \\text{दर (₹/किमी/क्विंटल)} \\times \\text{वजन}$$
$$\\text{बाजार समिती उपकर व दलाली} = \\text{एकूण महसूल} \\times \\text{कमिशन दर}$$
$$\\mathbf{निव्वळ\\,नफा\\,(Net\\,Return)} = \\mathbf{एकूण\\,महसूल - (वाहतूक\\,खर्च + दलाली)}$$

📍 अंतर मोजण्यासाठी आम्ही **Haversine Algorithm** वापरतो, ज्यामुळे शेतापासून बाजारापर्यंतचे अचूक अंतर समजते."""
        else:
            reply = """🚛 **How Smart Mandi Calculates Net Return:**

Smart Mandi doesn't just show market prices — it calculates your **true take-home profit** after all logistics and statutory deductions:

$$\\text{Gross Revenue} = \\text{Mandi Price (₹/Qtl)} \\times \\text{Quantity (Qtl)}$$
$$\\text{Transport Cost} = \\text{Haversine Distance (km)} \\times \\text{Rate (₹/km/qtl)} \\times \\text{Quantity}$$
$$\\text{Mandi Commission} = \\text{Gross Revenue} \\times \\text{Commission Rate (e.g. 2%) }$$
$$\\mathbf{Net\\,Return} = \\mathbf{Gross\\,Revenue - (Transport\\,Cost + Mandi\\,Commission)}$$

### 🌍 Real-World Logistics Example:
- **Mandi A (120 km away):** Price = ₹2,600/Qtl. Transport cost for 50 Qtl = ₹15,000.
- **Mandi B (15 km away):** Price = ₹2,500/Qtl. Transport cost for 50 Qtl = ₹1,875.
- **Result:** Mandi B gives you **₹8,125 MORE in your pocket**, even though its quoted price was ₹100 lower!

Use the **Price Advisor** sliders to simulate your quantity and diesel rates in real time."""

        return {
            'reply': reply,
            'suggestions': [
                "📍 Find Best Mandi",
                "⚡ Try What-If Sliders",
                "🌾 Today's Wheat Price",
                "🗺️ What is Market Atlas?"
            ],
            'topic': 'net_return_formula'
        }

    # -------------------------------------------------------------
    # 4. HOW TO USE / FIND BEST MANDI
    # -------------------------------------------------------------
    usage_keywords = ['how to use', 'find best', 'best mandi', 'find the best', 'how to find', 'how do i find', 'how to search', 'guide', 'steps', 'उपयोग कैसे', 'कैसे इस्तेमाल', 'कसा वापरायचा', 'वापर कसा', 'ఎలా ఉపయోగించాలి']
    if any(k in msg_lower for k in usage_keywords) or (('find' in msg_lower or 'search' in msg_lower) and 'mandi' in msg_lower):
        if lang == 'hi':
            reply = """📋 **स्मार्ट मंडी का उपयोग करने की 4 आसान चरण:**

1️⃣ **फसल चुनें (Select Commodity):**
   बाईं ओर के पैनल से अपनी फसल चुनें (जैसे गेहूँ, सरसों, कपास, टमाटर)।

2️⃣ **अपना स्थान सेट करें (Your Location):**
   **"Use My Location"** बटन दबाएँ या अपना राज्य और पिनकोड/अक्षांश चुनें।

3️⃣ **मात्रा व परिवहन दर डालें (Quantity & Transport):**
   अपनी फसल की मात्रा (क्विंटल में) और प्रति किमी मालभाड़ा सेट करें।

4️⃣ **"सर्वोत्तम मंडी खोजें" (Find Best Mandi) पर क्लिक करें:**
   प्रणाली तुरंत भारत भर की 50+ मंडियों की रैंकिंग बनाकर आपको **#1 सबसे अधिक मुनाफे वाली मंडी** का सुझाव देगी!"""
        else:
            reply = """📋 **Quick 4-Step Guide to Finding Your Best Mandi:**

1️⃣ **Select Commodity:**
   Choose your crop from the dropdown (e.g., Wheat, Mustard, Soybean, Cotton, Tomato).

2️⃣ **Set Your Location:**
   Click **"Use My Location"** for automatic GPS detection, or select your State from the list.

3️⃣ **Enter Quantity & Transport Rate:**
   Set the number of quintals you wish to sell and adjust the transport rate slider (default ₹2.5/km/qtl).

4️⃣ **Click "Find Best Mandi":**
   The AI engine ranks all APMC markets by Net Return, highlights the **#1 Recommended Mandi**, and displays the route preview and price trend charts!"""

        return {
            'reply': reply,
            'suggestions': [
                "🌾 What crops are supported?",
                "🚛 How is Net Return calculated?",
                "🗺️ Explore Market Atlas"
            ],
            'topic': 'how_to_use'
        }

    # -------------------------------------------------------------
    # 5. MARKET ATLAS
    # -------------------------------------------------------------
    atlas_keywords = ['atlas', 'market atlas', 'map', 'heatmap', 'cluster', 'एटलस', 'नक्शा', 'नकाशा', 'మ్యాప్']
    if any(k in msg_lower for k in atlas_keywords):
        if lang == 'hi':
            reply = """🗺️ **मार्केट एटलस (National Market Atlas) क्या है?**

मार्केट एटलस एक आधुनिक भू-स्थानिक (Geospatial) नक्शा है:
• **राज्य हीटमैप (State Heatmap):** राज्य स्तर पर औसत भावों का रंगीन नक्शा (हरा = किफायती भाव, लाल = उच्च भाव)।
• **मंडी क्लस्टर्स (Cluster Markers):** भारत की प्रमुख एपीएमसी मंडियों की भौगोलिक स्थिति और आवक।
• **कमोडिटी डैशबोर्ड (Commodity Dashboard):** राष्ट्रीय औसत, उच्चतम व न्यूनतम भाव, और एमएसपी बेंचमार्क का त्वरित कार्ड।
• **सटीक खोज:** राज्य या ज़िला चुनकर तुरंत ज़ूम करें।

👉 ऊपर नेविगेशन बार में **"Market Atlas"** पर क्लिक करके आप इसे देख सकते हैं!"""
        else:
            reply = """🗺️ **What is the Market Atlas?**

The **National Agriculture Market Atlas** is an interactive GIS intelligence platform:
• **State Choropleth Heatmap:** Visualizes state-by-state price bands with green-to-red gradients.
• **Mandi Clusters:** Dynamic Leaflet clustering showing 50+ major APMC hubs and arrivals.
• **Sliding Commodity Dashboard:** Real-time national average modal price, top & bottom mandis, and MSP spread.
• **State Summary Cards:** Drill-down into state-level trade volume and reporting mandi counts.

👉 Click **"Market Atlas"** in the top navigation to explore the nationwide geospatial map!"""

        return {
            'reply': reply,
            'suggestions': [
                "📍 Find Best Mandi",
                "🌾 Today's Wheat Price",
                "🇮🇳 What is MSP benchmark?"
            ],
            'topic': 'market_atlas'
        }

    # -------------------------------------------------------------
    # 6. LIVE PRICES / AGMARKNET FEED
    # -------------------------------------------------------------
    live_keywords = ['live', 'agmarknet', 'realtime', 'feed', 'data.gov.in', 'लाइव', 'एगमार्कनेट', 'थेट']
    if any(k in msg_lower for k in live_keywords):
        if lang == 'hi':
            reply = """🔴 **लाइव एगमार्कनेट (AGMARKNET) दैनिक भाव क्या हैं?**

• **सरकारी डेटा:** भारत सरकार के **Data.gov.in** पोर्टल और कृषि मंत्रालय के एगमार्कनेट नेटवर्क से जुड़ा हुआ है।
• **दैनिक आवक:** प्रतिदिन देशभर की 1,400+ मंडियों से न्यूनतम, अधिकतम व मॉडल भाव।
• **ऑटो-रिफ्रेश:** लाइव पेज हर 5 मिनट में नवीनतम रिकॉर्ड्स के साथ स्वतः अपडेट होता है।
• **सीएसवी एक्सपोर्ट:** आप किसी भी राज्य या फसल का लाइव डेटा एक क्लिक में डाउनलोड कर सकते हैं।

👉 ऊपर मेनू में **"Live Prices"** पर क्लिक करें!"""
        else:
            reply = """🔴 **Live AGMARKNET Daily Mandi Feed:**

• **Official Government Integration:** Direct pipeline to Ministry of Agriculture records via **Data.gov.in**.
• **Real-Time Data:** Daily arrival records with Min Price, Max Price, and Modal Price per quintal.
• **Auto-Refresh:** Live countdown timer with automatic background refresh every 5 minutes.
• **Filtering & CSV Export:** Filter by State, District, and Commodity with instant CSV export.

👉 Navigate to **"Live Prices"** in the top navigation bar to inspect today's live feed!"""

        return {
            'reply': reply,
            'suggestions': [
                "🌾 Check Live Wheat Rates",
                "📍 Price Advisor vs Live Feed",
                "📊 Daily Reports Page"
            ],
            'topic': 'live_feed'
        }

    # -------------------------------------------------------------
    # 7. MSP (MINIMUM SUPPORT PRICE)
    # -------------------------------------------------------------
    msp_keywords = ['msp', 'minimum support price', 'एमएसपी', 'समर्थन मूल्य', 'हमीभाव', 'కనీస మద్దతు']
    if any(k in msg_lower for k in msp_keywords):
        if lang == 'hi':
            reply = """🇮🇳 **न्यूनतम समर्थन मूल्य (MSP) और स्मार्ट मंडी:**

**MSP** भारत सरकार द्वारा कृषि लागत एवं मूल्य आयोग (CACP) की सिफारिश पर तय किया गया न्यूनतम मूल्य है, जिससे कम कीमत पर किसानों का शोषण न हो।

🌾 **प्रमुख फसलों के आधिकारिक MSP बेंचमार्क:**
• **गेहूं (Wheat):** ₹2,275 / क्विंटल
• **धान/चावल (Paddy/Rice):** ₹2,183 / क्विंटल
• **सरसों (Mustard):** ₹5,650 / क्विंटल
• **कपास (Cotton):** ₹7,020 / क्विंटल
• **चना (Chana):** ₹5,440 / क्विंटल
• **सोयाबीन (Soybean):** ₹4,600 / क्विंटल

💡 **स्मार्ट मंडी में एमएसपी का फायदा:**
जब आप कोई फसल चुनते हैं, तो सिस्टम तुरंत दिखाता है कि कौन-सी मंडी सरकार के **MSP से ऊपर** भाव दे रही है और कहाँ भाव कम है, जिससे आपको सही निर्णय लेने में मदद मिलती है।"""
        else:
            reply = """🇮🇳 **MSP (Minimum Support Price) Benchmark in Smart Mandi:**

The **MSP** is the guaranteed benchmark price set by the Government of India upon recommendations by the CACP to protect farmers from market distress.

🌾 **Key Commodity MSP Benchmarks:**
• **Wheat:** ₹2,275 / Quintal
• **Paddy (Rice):** ₹2,183 / Quintal
• **Mustard:** ₹5,650 / Quintal
• **Cotton (Medium Staple):** ₹7,020 / Quintal
• **Chana (Gram):** ₹5,440 / Quintal
• **Soybean:** ₹4,600 / Quintal

💡 **How Smart Mandi Uses MSP:**
Our platform automatically highlights whether an APMC market is trading **above (+)** or **below (−)** the government MSP benchmark, protecting you from distress sales."""

        return {
            'reply': reply,
            'suggestions': [
                "🌾 Today's Wheat Price",
                "🌾 Today's Mustard Price",
                "🚛 How is Net Return calculated?",
                "📍 Find Best Mandi"
            ],
            'topic': 'msp_policy'
        }

    # -------------------------------------------------------------
    # 8. WHAT-IF ANALYSIS
    # -------------------------------------------------------------
    whatif_keywords = ['what if', 'what-if', 'sensitivity', 'slider', 'स्लाइडर', 'संवेदनशीलता']
    if any(k in msg_lower for k in whatif_keywords):
        if lang == 'hi':
            reply = """⚡ **'क्या-अगर' (What-If) संवेदनशीलता विश्लेषण:**

यह टूल आपको बिना दोबारा सर्च किए तुरंत विभिन्न परिस्थितियों को परखने की सुविधा देता है:
• **फसल मात्रा स्लाइडर (1 - 500 क्विंटल):** मात्रा बदलने पर थोक परिवहन लागत का प्रभाव देखें।
• **परिवहन दर स्लाइडर (₹0.5 - ₹15 / किमी):** डीज़ल या ट्रैक्टर भाड़ा बढ़ने/घटने पर कौन सी मंडी बेहतर रहेगी।
• **कमीशन स्लाइडर:** विभिन्न राज्यों की मंडी समितियों के आढ़त/कमीशन का असर मापें।"""
        else:
            reply = """⚡ **Real-Time 'What-If' Sensitivity Analysis:**

The **What-If panel** lets you test hypothetical scenarios instantly without re-querying the database:
• **Quantity Slider (1 to 500 Qtl):** See how volume economy alters which mandi is most profitable.
• **Transport Rate Slider (₹0.5 to ₹15/km/qtl):** Simulate diesel price spikes or freight discounts.
• **Commission Slider:** Compare mandis with varying APMC cess and agent fees."""

        return {
            'reply': reply,
            'suggestions': [
                "🚛 How is Net Return calculated?",
                "📍 Find Best Mandi",
                "🗺️ What is Market Atlas?"
            ],
            'topic': 'what_if'
        }

    # -------------------------------------------------------------
    # 9. GENERAL / FALLBACK INTELLIGENCE
    # -------------------------------------------------------------
    if lang == 'hi':
        reply = f"""🌾 **मैं आपकी मदद के लिए उपस्थित हूँ!**

आपके प्रश्न *"{msg}"* के संदर्भ में, आप स्मार्ट मंडी पर ये मुख्य कार्य कर सकते हैं:
1. **Price Advisor:** अपनी फसल, मात्रा और स्थान चुनकर सर्वाधिक शुद्ध मुनाफा देने वाली मंडी खोजें।
2. **Market Atlas:** देशव्यापी नक्शे पर विभिन्न मंडियों के भावों की तुलना करें।
3. **Live Prices:** भारत सरकार के एगमार्कनेट पोर्टल से सीधे दैनिक भाव देखें।

कृपया नीचे दिए गए किसी भी सुझाव को चुनें या अपनी फसल का नाम लिखकर पूछें (उदा. *"गेहूँ का आज का भाव"*):"""
    elif lang == 'mr':
        reply = f"""🌾 **मी मदतीसाठी तयार आहे!**

आपण विचारलेल्या *"{msg}"* बद्दल खालील माहिती उपलब्ध आहे:
1. **Price Advisor:** शेतापासून कमी खर्चात जास्त नफा देणारी बाजार समिती शोधा.
2. **Market Atlas:** राज्यनिहाय नकाशावर दरांची तुलना करा.
3. **Live Prices:** थेट सरकारी एगमार्कनेट दर पहा.

कृपया खालील पर्यायांवर क्लिक करा किंवा पिकाचे नाव टाकून प्रश्न विचारा (उदा. *"कांद्याचे आजचे भाव"*):"""
    else:
        reply = f"""🌾 **I'm here to assist you with Smart Mandi!**

Regarding *"{msg}"*, here are the most helpful ways to get your answer:
• **Crop Rates:** Ask *"What is the price of Wheat / Cotton / Mustard?"*
• **Profit Calculation:** Ask *"How is Net Return calculated?"*
• **Market Guidance:** Ask *"How do I find the best mandi?"* or *"What is Market Atlas?"*
• **Live Feed:** Ask *"Where does live AGMARKNET data come from?"*

Choose one of the quick prompts below or ask any agricultural market question!"""

    return {
        'reply': reply,
        'suggestions': [
            "🌾 Today's Wheat Price",
            "🚛 How is Net Return calculated?",
            "📍 How to find best mandi?",
            "🗺️ What is Market Atlas?",
            "🇮🇳 What is MSP benchmark?"
        ],
        'topic': 'fallback'
    }
