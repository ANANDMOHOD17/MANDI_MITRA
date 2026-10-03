/**
 * SMART MANDI — Multi-Language Support (i18n Engine)
 * Languages: English (en), Hindi (hi), Marathi (mr), Telugu (te), Punjabi (pa), Gujarati (gu)
 */

const MandiI18n = {
    currentLang: 'en',
    
    languages: {
        en: { name: 'English', flag: '🌐' },
        hi: { name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
        mr: { name: 'मराठी (Marathi)', flag: '🇮🇳' },
        te: { name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
        pa: { name: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
        gu: { name: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' }
    },

    translations: {
        en: {
            app_title: "Smart Mandi Price Advisor",
            app_subtitle: "Smart Mandi Price Advisor for Indian Farmers",
            nav_advisor: "Price Advisor",
            nav_atlas: "Market Atlas",
            nav_reports: "Reports",
            nav_live: "Live Prices",
            nav_intro: "Intro Tour",
            
            // Dashboard Stats
            stat_total_markets: "Total Markets",
            stat_total_commodities: "Total Commodities",
            stat_top_price: "Today's Top Price",
            stat_active_mandi: "Most Active Mandi",
            
            // Search Form
            search_criteria: "Search Criteria",
            live_feed_badge: "Live AGMARKNET Feed",
            live_feed_desc: "Pan-India Daily Mandi Rates",
            select_commodity: "Select Commodity",
            your_location: "Your Location",
            select_state: "Select State...",
            use_my_location: "Use My Location",
            quantity_label: "Quantity (Quintals)",
            transport_rate_label: "Transport Rate (₹/km/qtl)",
            custom_transport_label: "Custom Transport Cost (₹)",
            custom_transport_opt: "(Optional)",
            find_best_mandi: "Find Best Mandi",
            searching_mandis: "Searching mandis...",
            
            // Welcome Empty State
            welcome_title: "Welcome to Smart Mandi Price Advisor",
            welcome_desc: "Fill out the search criteria on the left and click 'Find Best Mandi' to get personalized market recommendations based on your location and commodity.",
            
            // Recommendation Card
            rank_1_recommended: "#1 Recommended",
            trend_rising: "Rising",
            trend_falling: "Falling",
            trend_stable: "Stable",
            est_net_return: "Estimated Net Return",
            after_deductions: "After transport & fees",
            why_this_mandi: "Why this mandi?",
            away: "km away",
            arrival_today: "Arrival",
            range_label: "Range",
            
            // Ranking Table
            top_mandis_title: "Top 10 Mandis by Net Return",
            export_btn: "Export",
            col_rank: "Rank",
            col_mandi: "Mandi Name",
            col_price: "Price (₹/Qtl)",
            col_transport: "Transport",
            col_commission: "Commission",
            col_net_return: "Net Return",
            col_trend: "7D Trend",
            col_action: "Action",
            details_btn: "Details",
            benchmark_model: "Benchmark Model",
            
            // What-If Analysis
            what_if_title: "Real-Time 'What-If' Sensitivity Analysis",
            what_if_desc: "Adjust quantity and transport assumptions to instantly update rankings:",
            adjust_quantity: "Adjust Quantity:",
            adjust_transport: "Adjust Transport Rate:",
            
            // Charts
            chart_price_comp: "Top 10 Mandis Price Comparison (₹/Qtl)",
            chart_net_breakdown: "Net Return Breakdown (Gross vs Deductions)",
            chart_trend: "30-Day Modal Price Trend",
            chart_route_preview: "Transit Route Preview",
            
            // Modal
            modal_commodities_title: "Live Commodities Traded Today (AGMARKNET):",
            modal_all_commodities: "All Mandi Commodities (Historical):",
            close_btn: "Close",

            // Atlas Page
            atlas_title: "National Agriculture Market Atlas",
            atlas_subtitle: "Interactive Geospatial APMC Mandi Intelligence",
            atlas_search_placeholder: "Search mandi, district, state...",
            atlas_select_commodity: "Select Commodity",
            atlas_all_crops: "All Crops Overview",
            atlas_all_states: "All States",
            atlas_layer_heatmap: "Price Heatmap",
            atlas_layer_clusters: "Mandi Clusters",
            atlas_reset_view: "Reset National View",
            atlas_national_avg: "National Average",
            atlas_highest_mandi: "Highest Price Mandi",
            atlas_lowest_mandi: "Lowest Price Mandi",
            atlas_msp_benchmark: "MSP Benchmark",
            atlas_price_spread: "Price Spread",

            // Reports Page
            reports_title: "Daily Mandi Price Reports",
            reports_subtitle: "Official Market Arrivals & Price Bulletins",
            reports_download_csv: "Download CSV",
            reports_print: "Print Report",
            reports_filter_date: "Select Date",
            reports_filter_state: "Filter by State",
            reports_filter_commodity: "Filter by Commodity",

            // Live Page
            live_title: "Live Mandi Prices Feed",
            live_auto_refresh: "Auto-refresh in:",
            live_records_today: "Total Records Today",
            live_states_reporting: "States Reporting",
            live_highest_priced: "Highest Priced Crop",
            live_lowest_priced: "Lowest Priced Crop",
            live_filter_district: "District"
        },

        hi: {
            app_title: "स्मार्ट मंडी मूल्य सलाहकार",
            app_subtitle: "भारतीय किसानों के लिए स्मार्ट मंडी मूल्य व मुनाफा सलाहकार",
            nav_advisor: "मूल्य सलाहकार",
            nav_atlas: "मार्केट एटलस",
            nav_reports: "दैनिक रिपोर्ट",
            nav_live: "लाइव भाव",
            nav_intro: "परिचय टूर",

            // Dashboard Stats
            stat_total_markets: "कुल मंडियां",
            stat_total_commodities: "कुल फसलें",
            stat_top_price: "आज का सर्वोच्च भाव",
            stat_active_mandi: "सबसे सक्रिय मंडी",

            // Search Form
            search_criteria: "खोज मापदंड",
            live_feed_badge: "लाइव एगमार्कनेट फीड",
            live_feed_desc: "अखिल भारतीय दैनिक मंडी भाव",
            select_commodity: "फसल चुनें",
            your_location: "आपका स्थान",
            select_state: "राज्य चुनें...",
            use_my_location: "मेरा स्थान उपयोग करें",
            quantity_label: "मात्रा (क्विंटल)",
            transport_rate_label: "परिवहन दर (₹/किमी/क्विंटल)",
            custom_transport_label: "कस्टम परिवहन लागत (₹)",
            custom_transport_opt: "(वैकल्पिक)",
            find_best_mandi: "सर्वोत्तम मंडी खोजें",
            searching_mandis: "मंडियों की खोज की जा रही है...",

            // Welcome Empty State
            welcome_title: "स्मार्ट मंडी मूल्य सलाहकार में आपका स्वागत है",
            welcome_desc: "बाईं ओर अपनी फसल और स्थान चुनें और अपने लिए सबसे अधिक मुनाफा देने वाली मंडी खोजने के लिए 'सर्वोत्तम मंडी खोजें' पर क्लिक करें।",

            // Recommendation Card
            rank_1_recommended: "#1 सर्वोत्तम अनुशंसित",
            trend_rising: "बढ़ता हुआ",
            trend_falling: "गिरता हुआ",
            trend_stable: "स्थिर",
            est_net_return: "अनुमानित शुद्ध मुनाफा",
            after_deductions: "परिवहन व कमीशन काटकर",
            why_this_mandi: "यही मंडी क्यों चुनें?",
            away: "किमी दूर",
            arrival_today: "आवक",
            range_label: "दैनिक दायरा",

            // Ranking Table
            top_mandis_title: "शुद्ध मुनाफे के अनुसार शीर्ष 10 मंडियां",
            export_btn: "डाउनलोड",
            col_rank: "रैंक",
            col_mandi: "मंडी का नाम",
            col_price: "भाव (₹/क्विंटल)",
            col_transport: "परिवहन लागत",
            col_commission: "कमीशन/शुल्क",
            col_net_return: "शुद्ध मुनाफा",
            col_trend: "7D रुझान",
            col_action: "कार्रवाई",
            details_btn: "विवरण",
            benchmark_model: "मॉडल भाव",

            // What-If Analysis
            what_if_title: "तुरंत 'क्या-अगर' संवेदनशीलता विश्लेषण",
            what_if_desc: "मात्रा और परिवहन दर बदलकर तुरंत नया मुनाफा देखें:",
            adjust_quantity: "मात्रा बदलें:",
            adjust_transport: "परिवहन दर बदलें:",

            // Charts
            chart_price_comp: "शीर्ष 10 मंडियों के भावों की तुलना (₹/क्विंटल)",
            chart_net_breakdown: "शुद्ध मुनाफा विश्लेषण (सकल आय बनाम कटौती)",
            chart_trend: "30 दिनों का मूल्य रुझान",
            chart_route_preview: "खेत से मंडी का मार्ग नक्शा",

            // Modal
            modal_commodities_title: "आज मंडी में बिकने वाली फसलें (एगमार्कनेट):",
            modal_all_commodities: "मंडी की सभी फसलें (ऐतिहासिक):",
            close_btn: "बंद करें",

            // Atlas Page
            atlas_title: "राष्ट्रीय कृषि बाज़ार एटलस",
            atlas_subtitle: "इंटरैक्टिव भू-स्थानिक एपीएमसी मंडी मानचित्र",
            atlas_search_placeholder: "मंडी, ज़िला या राज्य खोजें...",
            atlas_select_commodity: "फसल चुनें",
            atlas_all_crops: "सभी फसलों का अवलोकन",
            atlas_all_states: "सभी राज्य",
            atlas_layer_heatmap: "मूल्य हीटमैप",
            atlas_layer_clusters: "मंडी क्लस्टर",
            atlas_reset_view: "राष्ट्रीय दृश्य रीसेट करें",
            atlas_national_avg: "राष्ट्रीय औसत",
            atlas_highest_mandi: "उच्चतम भाव वाली मंडी",
            atlas_lowest_mandi: "न्यूनतम भाव वाली मंडी",
            atlas_msp_benchmark: "एमएसपी बेंचमार्क",
            atlas_price_spread: "मूल्य अंतर",

            // Reports Page
            reports_title: "दैनिक मंडी भाव रिपोर्ट",
            reports_subtitle: "आधिकारिक बाज़ार आवक एवं मूल्य बुलेटिन",
            reports_download_csv: "सीएसवी डाउनलोड करें",
            reports_print: "प्रिंट रिपोर्ट",
            reports_filter_date: "तारीख चुनें",
            reports_filter_state: "राज्य अनुसार फिल्टर",
            reports_filter_commodity: "फसल अनुसार फिल्टर",

            // Live Page
            live_title: "लाइव मंडी भाव फीड",
            live_auto_refresh: "ऑटो-रिफ्रेश में समय:",
            live_records_today: "आज के कुल रिकॉर्ड",
            live_states_reporting: "रिपोर्ट करने वाले राज्य",
            live_highest_priced: "सबसे महंगी फसल",
            live_lowest_priced: "सबसे सस्ती फसल",
            live_filter_district: "ज़िला"
        },

        mr: {
            app_title: "स्मार्ट कृषी बाजार भाव सल्लागार",
            app_subtitle: "शेतकऱ्यांसाठी सर्वाधिक नफा मिळवून देणारा कृषी सल्लागार",
            nav_advisor: "भाव सल्लागार",
            nav_atlas: "बाजार नकाशा",
            nav_reports: "दैनिक अहवाल",
            nav_live: "थेट भाव",
            nav_intro: "मार्गदर्शन टूर",

            stat_total_markets: "एकूण बाजार समित्या",
            stat_total_commodities: "एकूण शेतीमाल/पिके",
            stat_top_price: "आजचा सर्वोच्च दर",
            stat_active_mandi: "सर्वाधिक आवक बाजार",

            search_criteria: "शोध निकष",
            live_feed_badge: "थेट एगमार्कनेट फीड",
            live_feed_desc: "संपूर्ण भारतातील दैनिक बाजार भाव",
            select_commodity: "शेतीमाल निवडा",
            your_location: "तुमचे ठिकाण",
            select_state: "राज्य निवडा...",
            use_my_location: "माझे ठिकाण वापरा",
            quantity_label: "प्रमाण (क्विंटल)",
            transport_rate_label: "वाहतूक दर (₹/किमी/क्विंटल)",
            custom_transport_label: "स्वतःचा वाहतूक खर्च (₹)",
            custom_transport_opt: "(पर्यायी)",
            find_best_mandi: "सर्वोत्तम बाजार शोधा",
            searching_mandis: "बाजार समित्या शोधत आहे...",

            welcome_title: "स्मार्ट कृषी बाजार भाव सल्लागार मध्ये आपले स्वागत आहे",
            welcome_desc: "डाव्या बाजूला तुमचे पीक व स्थान निवडा आणि कोणत्या बाजारात माल विकल्यास सर्वात जास्त नफा मिळेल हे त्वरित जाणून घ्या.",

            rank_1_recommended: "#1 सर्वोत्तम शिफारस",
            trend_rising: "वाढता",
            trend_falling: "घसरता",
            trend_stable: "स्थिर",
            est_net_return: "अंदाजे निव्वळ नफा",
            after_deductions: "वाहतूक व अडत वजा जाता",
            why_this_mandi: "हाच बाजार का निवडावा?",
            away: "किमी अंतर",
            arrival_today: "आवक",
            range_label: "दैनिक कक्षा",

            top_mandis_title: "निव्वळ नफ्यानुसार पहिल्या 10 बाजार समित्या",
            export_btn: "डाउनलोड",
            col_rank: "रँक",
            col_mandi: "बाजार समितीचे नाव",
            col_price: "सरासरी भाव (₹/क्विंटल)",
            col_transport: "वाहतूक खर्च",
            col_commission: "अडत/कमिशन",
            col_net_return: "निव्वळ नफा",
            col_trend: "7 दिवसांचा कल",
            col_action: "कृती",
            details_btn: "सविस्तर माहिती",
            benchmark_model: "मॉडेल भाव",

            what_if_title: "तात्काळ 'काय-जर' संवेदनशीलता विश्लेषण",
            what_if_desc: "प्रमाण आणि वाहतूक दर बदलून लगेच नवा नफा तपासा:",
            adjust_quantity: "प्रमाण बदला:",
            adjust_transport: "वाहतूक दर बदला:",

            chart_price_comp: "पहिल्या 10 बाजार समित्यांची भाव तुलना (₹/क्विंटल)",
            chart_net_breakdown: "निव्वळ नफा विश्लेषण (एकूण उत्पन्न वजा खर्च)",
            chart_trend: "30 दिवसांचा भाव कल",
            chart_route_preview: "शेत ते बाजार वाहतूक नकाशा",

            modal_commodities_title: "आज बाजारात खरेदी-विक्री झालेली पिके (थेट):",
            modal_all_commodities: "बाजारातील सर्व पिके (ऐतिहासिक):",
            close_btn: "बंद करा",

            atlas_title: "राष्ट्रीय कृषी बाजार नकाशा (एटलस)",
            atlas_subtitle: "भारतातील सर्व एपीएमसी बाजार समित्यांची नकाशावर माहिती",
            atlas_search_placeholder: "बाजार, जिल्हा किंवा राज्य शोधा...",
            atlas_select_commodity: "पीक निवडा",
            atlas_all_crops: "सर्व पिके",
            atlas_all_states: "सर्व राज्ये",
            atlas_layer_heatmap: "भाव उष्णता नकाशा (हीटमॅप)",
            atlas_layer_clusters: "बाजार संच",
            atlas_reset_view: "नकाशा मूळ स्थितीत आणा",
            atlas_national_avg: "राष्ट्रीय सरासरी",
            atlas_highest_mandi: "सर्वाधिक भाव देणारी बाजार समिती",
            atlas_lowest_mandi: "कमी भाव देणारी बाजार समिती",
            atlas_msp_benchmark: "हमीभाव (MSP) तुलना",
            atlas_price_spread: "भाव फरक",

            reports_title: "दैनिक बाजार भाव अहवाल",
            reports_subtitle: "अधिकृत बाजार आवक व दर पत्रक",
            reports_download_csv: "CSV डाउनलोड करा",
            reports_print: "अहवाल प्रिंट करा",
            reports_filter_date: "दिनांक निवडा",
            reports_filter_state: "राज्य निवडा",
            reports_filter_commodity: "पीक निवडा",

            live_title: "थेट (Live) बाजार भाव माहिती",
            live_auto_refresh: "पुढील रिफ्रेश:",
            live_records_today: "आजचे एकूण नोंदी",
            live_states_reporting: "माहिती देणारी राज्ये",
            live_highest_priced: "सर्वाधिक दराचे पीक",
            live_lowest_priced: "कमी दराचे पीक",
            live_filter_district: "जिल्हा"
        },

        te: {
            app_title: "స్మార్ట్ మార్కెట్ ధర సలహాదారు",
            app_subtitle: "రైతులకు అత్యధిక లాభాన్ని అందించే మార్కెట్ సలహాదారు",
            nav_advisor: "ధర సలహాదారు",
            nav_atlas: "మార్కెట్ అట్లాస్",
            nav_reports: "నివేదికలు",
            nav_live: "లైవ్ ధరలు",
            nav_intro: "పరిచయం టూర్",

            stat_total_markets: "మొత్తం మార్కెట్లు",
            stat_total_commodities: "మొత్తం పంటలు",
            stat_top_price: "నేటి అత్యధిక ధర",
            stat_active_mandi: "అత్యంత చురుకైన మార్కెట్",

            search_criteria: "శోధన ప్రమాణాలు",
            live_feed_badge: "లైవ్ అగ్‌మార్క్‌నెట్ ఫీడ్",
            live_feed_desc: "భారతదేశ వ్యాప్తంగా రోజువారీ ధరలు",
            select_commodity: "పంటను ఎంచుకోండి",
            your_location: "మీ స్థానం",
            select_state: "రాష్ట్రం ఎంచుకోండి...",
            use_my_location: "నా స్థానాన్ని ఉపయోగించండి",
            quantity_label: "పరిమాణం (క్వింటాళ్ళు)",
            transport_rate_label: "రవాణా రేటు (₹/కిమీ/క్వింటాల్)",
            custom_transport_label: "అనుకూల రవాణా ఖర్చు (₹)",
            custom_transport_opt: "(ఐచ్ఛికం)",
            find_best_mandi: "ఉత్తమ మార్కెట్‌ను కనుగొనండి",
            searching_mandis: "మార్కెట్ల కోసం శోధిస్తోంది...",

            welcome_title: "స్మార్ట్ మార్కెట్ ధర సలహాదారుకు స్వాగతం",
            welcome_desc: "మీ పంట మరియు స్థానాన్ని ఎంచుకుని, మీకు అత్యధిక లాభాన్ని ఇచ్చే మార్కెట్‌ను వెంటనే తెలుసుకోండి.",

            rank_1_recommended: "#1 ఉత్తమ సిఫార్సు",
            trend_rising: "పెరుగుతోంది",
            trend_falling: "తగ్గుతోంది",
            trend_stable: "స్థిరంగా ఉంది",
            est_net_return: "అంచనా నికర రాబడి",
            after_deductions: "రవాణా & కమీషన్ తర్వాత",
            why_this_mandi: "ఈ మార్కెట్‌నే ఎందుకు ఎంచుకోవాలి?",
            away: "కి.మీ దూరం",
            arrival_today: "రాక",
            range_label: "ధర పరిధి",

            top_mandis_title: "నికర లాభం ప్రకారం టాప్ 10 మార్కెట్లు",
            export_btn: "ఎగుమతి",
            col_rank: "ర్యాంక్",
            col_mandi: "మార్కెట్ పేరు",
            col_price: "ధర (₹/క్వింటాల్)",
            col_transport: "రవాణా ఖర్చు",
            col_commission: "కమీషన్",
            col_net_return: "నికర లాభం",
            col_trend: "7 రోజుల ధోరణి",
            col_action: "చర్య",
            details_btn: "వివరాలు",
            benchmark_model: "మోడల్ ధర",

            what_if_title: "రియల్ టైమ్ 'వాట్-ఇఫ్' విశ్లేషణ",
            what_if_desc: "పరిమాణం మరియు రవాణా రేటు మార్చి కొత్త లాభాన్ని వెంటనే చూడండి:",
            adjust_quantity: "పరిమాణం మార్చండి:",
            adjust_transport: "రవాణా రేటు మార్చండి:",

            chart_price_comp: "టాప్ 10 మార్కెట్ల ధరల పోలిక (₹/క్వింటాల్)",
            chart_net_breakdown: "నికర రాబడి విశ్లేషణ",
            chart_trend: "30 రోజుల ధర ధోరణి",
            chart_route_preview: "రవాణా రూట్ మ్యాప్",

            modal_commodities_title: "ఈరోజు మార్కెట్‌లో ట్రేడ్ అయిన పంటలు (లైవ్):",
            modal_all_commodities: "మార్కెట్ మొత్తం పంటలు:",
            close_btn: "మూసివేయి",

            atlas_title: "జాతీయ వ్యవసాయ మార్కెట్ అట్లాస్",
            atlas_subtitle: "భారతదేశంలోని వ్యవసాయ మార్కెట్ల జియో మ్యాప్",
            atlas_search_placeholder: "మార్కెట్, జిల్లా లేదా రాష్ట్రాన్ని శోధించండి...",
            atlas_select_commodity: "పంటను ఎంచుకోండి",
            atlas_all_crops: "అన్ని పంటలు",
            atlas_all_states: "అన్ని రాష్ట్రాలు",
            atlas_layer_heatmap: "ధర హీట్‌మ్యాప్",
            atlas_layer_clusters: "మార్కెట్ సమూహాలు",
            atlas_reset_view: "మ్యాప్ రీసెట్ చేయండి",
            atlas_national_avg: "జాతీయ సగటు",
            atlas_highest_mandi: "అత్యధిక ధర మార్కెట్",
            atlas_lowest_mandi: "అత్యల్ప ధర మార్కెట్",
            atlas_msp_benchmark: "కనీస మద్దతు ధర (MSP)",
            atlas_price_spread: "ధర తేడా",

            reports_title: "రోజువారీ మార్కెట్ నివేదికలు",
            reports_subtitle: "అధికారిక మార్కెట్ రాక & ధర సమాచారం",
            reports_download_csv: "CSV డౌన్‌లోడ్",
            reports_print: "ప్రింట్",
            reports_filter_date: "తేదీ ఎంచుకోండి",
            reports_filter_state: "రాష్ట్రం ప్రకారం",
            reports_filter_commodity: "పంట ప్రకారం",

            live_title: "లైవ్ మార్కెట్ ధరలు",
            live_auto_refresh: "స్వీయ రిఫ్రెష్ సమయం:",
            live_records_today: "నేటి రికార్డులు",
            live_states_reporting: "రాష్ట్రాలు",
            live_highest_priced: "అత్యధిక ధర పంట",
            live_lowest_priced: "అత్యల్ప ధర పంట",
            live_filter_district: "జిల్లా"
        },

        pa: {
            app_title: "ਸਮਾਰਟ ਮੰਡੀ ਮੁੱਲ ਸਲਾਹਕਾਰ",
            app_subtitle: "ਕਿਸਾਨਾਂ ਲਈ ਮੁਨਾਫਾ ਅਤੇ ਸਹੀ ਮੰਡੀ ਦੀ ਚੋਣ ਦਾ ਸਲਾਹਕਾਰ",
            nav_advisor: "ਮੁੱਲ ਸਲਾਹਕਾਰ",
            nav_atlas: "ਮੰਡੀ ਐਟਲਸ",
            nav_reports: "ਰਿਪੋਰਟਾਂ",
            nav_live: "ਲਾਈਵ ਰੇਟ",
            nav_intro: "ਜਾਣ-ਪਛਾਣ",

            stat_total_markets: "ਕੁੱਲ ਮੰਡੀਆਂ",
            stat_total_commodities: "ਕੁੱਲ ਫਸਲਾਂ",
            stat_top_price: "ਅੱਜ ਦਾ ਸਭ ਤੋਂ ਉੱਚਾ ਰੇਟ",
            stat_active_mandi: "ਸਭ ਤੋਂ ਸਰਗਰਮ ਮੰਡੀ",

            search_criteria: "ਖੋਜ ਮਾਪਦੰਡ",
            live_feed_badge: "ਲਾਈਵ ਐਗਮਾਰਕਨੈੱਟ ਫੀਡ",
            live_feed_desc: "ਪੂਰੇ ਭਾਰਤ ਦੇ ਰੋਜ਼ਾਨਾ ਮੰਡੀ ਰੇਟ",
            select_commodity: "ਫਸਲ ਚੁਣੋ",
            your_location: "ਤੁਹਾਡੀ ਸਥਿਤੀ",
            select_state: "ਰਾਜ ਚੁਣੋ...",
            use_my_location: "ਮੇਰੀ ਸਥਿਤੀ ਵਰਤੋ",
            quantity_label: "ਮਾਤਰਾ (ਕੁਇੰਟਲ)",
            transport_rate_label: "ਆਵਾਜਾਈ ਦਰ (₹/ਕਿਮੀ/ਕੁਇੰਟਲ)",
            custom_transport_label: "ਕਸਟਮ ਆਵਾਜਾਈ ਖਰਚਾ (₹)",
            custom_transport_opt: "(ਵਿਕਲਪਿਕ)",
            find_best_mandi: "ਸਭ ਤੋਂ ਵਧੀਆ ਮੰਡੀ ਲੱਭੋ",
            searching_mandis: "ਮੰਡੀਆਂ ਲੱਭੀਆਂ ਜਾ ਰਹੀਆਂ ਹਨ...",

            welcome_title: "ਸਮਾਰਟ ਮੰਡੀ ਸਲਾਹਕਾਰ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ",
            welcome_desc: "ਆਪਣੀ ਫਸਲ ਅਤੇ ਸਥਾਨ ਚੁਣੋ ਅਤੇ ਜਾਣੋ ਕਿ ਕਿਸ ਮੰਡੀ ਵਿੱਚ ਵੇਚਣ ਨਾਲ ਤੁਹਾਨੂੰ ਸਭ ਤੋਂ ਵੱਧ ਸ਼ੁੱਧ ਮੁਨਾਫਾ ਮਿਲੇਗਾ।",

            rank_1_recommended: "#1 ਸਭ ਤੋਂ ਵਧੀਆ ਮੰਡੀ",
            trend_rising: "ਵਧਦਾ",
            trend_falling: "ਘਟਦਾ",
            trend_stable: "ਸਥਿਰ",
            est_net_return: "ਅੰਦਾਜ਼ਨ ਸ਼ੁੱਧ ਮੁਨਾਫ਼ਾ",
            after_deductions: "ਆਵਾਜਾਈ ਅਤੇ ਖਰਚੇ ਕੱਟਣ ਤੋਂ ਬਾਅਦ",
            why_this_mandi: "ਇਹ ਮੰਡੀ ਕਿਉਂ?",
            away: "ਕਿਮੀ ਦੂਰ",
            arrival_today: "ਆਮਦ",
            range_label: "ਰੇਟ ਦਾ ਦਾਇਰਾ",

            top_mandis_title: "ਸ਼ੁੱਧ ਮੁਨਾਫੇ ਅਨੁਸਾਰ ਚੋਟੀ ਦੀਆਂ 10 ਮੰਡੀਆਂ",
            export_btn: "ਡਾਊਨਲੋਡ",
            col_rank: "ਰੈਂਕ",
            col_mandi: "ਮੰਡੀ ਦਾ ਨਾਂ",
            col_price: "ਮੁੱਲ (₹/ਕੁਇੰਟਲ)",
            col_transport: "ਆਵਾਜਾਈ ਖਰਚਾ",
            col_commission: "ਕਮਿਸ਼ਨ/ਆੜ੍ਹਤ",
            col_net_return: "ਸ਼ੁੱਧ ਲਾਭ",
            col_trend: "7 ਦਿਨਾਂ ਦਾ ਰੁਝਾਨ",
            col_action: "ਕਾਰਵਾਈ",
            details_btn: "ਵੇਰਵੇ",
            benchmark_model: "ਮਾਡਲ ਰੇਟ",

            what_if_title: "ਤੁਰੰਤ 'ਕੀ-ਜੇਕਰ' ਵਿਸ਼ਲੇਸ਼ਣ",
            what_if_desc: "ਮਾਤਰਾ ਅਤੇ ਆਵਾਜਾਈ ਦਰ ਬਦਲ ਕੇ ਤੁਰੰਤ ਨਵਾਂ ਮੁਨਾਫ਼ਾ ਵੇਖੋ:",
            adjust_quantity: "ਮਾਤਰਾ ਬਦਲੋ:",
            adjust_transport: "ਆਵਾਜਾਈ ਦਰ ਬਦਲੋ:",

            chart_price_comp: "ਚੋਟੀ ਦੀਆਂ 10 ਮੰਡੀਆਂ ਦੇ ਰੇਟਾਂ ਦੀ ਤੁਲਨਾ",
            chart_net_breakdown: "ਸ਼ੁੱਧ ਮੁਨਾਫ਼ਾ ਵਿਸ਼ਲੇਸ਼ਣ",
            chart_trend: "30 ਦਿਨਾਂ ਦਾ ਰੇਟ ਰੁਝਾਨ",
            chart_route_preview: "ਖੇਤ ਤੋਂ ਮੰਡੀ ਦਾ ਰਸਤਾ",

            modal_commodities_title: "ਅੱਜ ਮੰਡੀ ਵਿੱਚ ਵਿਕੀਆਂ ਫਸਲਾਂ (ਲਾਈਵ):",
            modal_all_commodities: "ਮੰਡੀ ਦੀਆਂ ਸਾਰੀਆਂ ਫਸਲਾਂ:",
            close_btn: "ਬੰਦ ਕਰੋ",

            atlas_title: "ਰਾਸ਼ਟਰੀ ਖੇਤੀਬਾੜੀ ਮੰਡੀ ਐਟਲਸ",
            atlas_subtitle: "ਨਕਸ਼ੇ 'ਤੇ ਭਾਰਤ ਦੀਆਂ ਸਾਰੀਆਂ ਮੰਡੀਆਂ ਦੀ ਜਾਣਕਾਰੀ",
            atlas_search_placeholder: "ਮੰਡੀ, ਜ਼ਿਲ੍ਹਾ ਜਾਂ ਰਾਜ ਲੱਭੋ...",
            atlas_select_commodity: "ਫਸਲ ਚੁਣੋ",
            atlas_all_crops: "ਸਾਰੀਆਂ ਫਸਲਾਂ",
            atlas_all_states: "ਸਾਰੇ ਰਾਜ",
            atlas_layer_heatmap: "ਰੇਟ ਹੀਟਮੈਪ",
            atlas_layer_clusters: "ਮੰਡੀ ਕਲੱਸਟਰ",
            atlas_reset_view: "ਨਕਸ਼ਾ ਰੀਸੈੱਟ ਕਰੋ",
            atlas_national_avg: "ਰਾਸ਼ਟਰੀ ਔਸਤ",
            atlas_highest_mandi: "ਸਭ ਤੋਂ ਵੱਧ ਰੇਟ ਵਾਲੀ ਮੰਡੀ",
            atlas_lowest_mandi: "ਸਭ ਤੋਂ ਘੱਟ ਰੇਟ ਵਾਲੀ ਮੰਡੀ",
            atlas_msp_benchmark: "ਸਰਕਾਰੀ ਐਮਐਸਪੀ (MSP)",
            atlas_price_spread: "ਰੇਟ ਦਾ ਫਰਕ",

            reports_title: "ਰੋਜ਼ਾਨਾ ਮੰਡੀ ਰਿਪੋਰਟਾਂ",
            reports_subtitle: "ਸਰਕਾਰੀ ਮੰਡੀ ਆਮਦ ਅਤੇ ਰੇਟ ਬੁਲੇਟਿਨ",
            reports_download_csv: "CSV ਡਾਊਨਲੋਡ ਕਰੋ",
            reports_print: "ਪ੍ਰਿੰਟ ਕਰੋ",
            reports_filter_date: "ਮਿਤੀ ਚੁਣੋ",
            reports_filter_state: "ਰਾਜ ਅਨੁਸਾਰ",
            reports_filter_commodity: "ਫਸਲ ਅਨੁਸਾਰ",

            live_title: "ਲਾਈਵ ਮੰਡੀ ਰੇਟ ਫੀਡ",
            live_auto_refresh: "ਆਟੋ-ਰਿਫ੍ਰੈਸ਼ ਸਮਾਂ:",
            live_records_today: "ਅੱਜ ਦੇ ਕੁੱਲ ਰਿਕਾਰਡ",
            live_states_reporting: "ਰਿਪੋਰਟਿੰਗ ਰਾਜ",
            live_highest_priced: "ਸਭ ਤੋਂ ਮਹਿੰਗੀ ਫਸਲ",
            live_lowest_priced: "ਸਭ ਤੋਂ ਸਸਤੀ ਫਸਲ",
            live_filter_district: "ਜ਼ਿਲ੍ਹਾ"
        },

        gu: {
            app_title: "સ્માર્ટ માર્કેટ ભાવ સલાહકાર",
            app_subtitle: "ખેડૂતો માટે મહત્તમ નફો મેળવી આપતો સ્માર્ટ સલાહકાર",
            nav_advisor: "ભાવ સલાહકાર",
            nav_atlas: "માર્કેટ એટલાસ",
            nav_reports: "દૈનિક અહેવાલ",
            nav_live: "લાઈવ ભાવો",
            nav_intro: "પરિચય પ્રવાસ",

            stat_total_markets: "કુલ માર્કેટ યાર્ડ",
            stat_total_commodities: "કુલ પાકો/જણસીઓ",
            stat_top_price: "આજનો સર્વોચ્ચ ભાવ",
            stat_active_mandi: "સૌથી સક્રિય માર્કેટ",

            search_criteria: "શોધ માપદંડ",
            live_feed_badge: "લાઈવ એગમાર્કનેટ ફીડ",
            live_feed_desc: "સમગ્ર ભારતના દૈનિક બજાર ભાવો",
            select_commodity: "પાક પસંદ કરો",
            your_location: "તમારું સ્થાન",
            select_state: "રાજ્ય પસંદ કરો...",
            use_my_location: "મારું સ્થાન વાપરો",
            quantity_label: "જથ્થો (ક્વિન્ટલ)",
            transport_rate_label: "પરિવહન દર (₹/કિમી/ક્વિન્ટલ)",
            custom_transport_label: "કસ્ટમ પરિવહન ખર્ચ (₹)",
            custom_transport_opt: "(વૈકલ્પિક)",
            find_best_mandi: "શ્રેષ્ઠ માર્કેટ શોધો",
            searching_mandis: "માર્કેટ્સ શોધી રહ્યાં છીએ...",

            welcome_title: "સ્માર્ટ માર્કેટ ભાવ સલાહકારમાં આપનું સ્વાગત છે",
            welcome_desc: "ડાબી બાજુએ તમારો પાક અને સ્થાન પસંદ કરો અને કયા માર્કેટમાં વેચવાથી સૌથી વધુ નફો થશે તે તુરંત જાણો.",

            rank_1_recommended: "#1 શ્રેષ્ઠ ભલામણ",
            trend_rising: "વધતો",
            trend_falling: "ઘટતો",
            trend_stable: "સ્થિર",
            est_net_return: "અંદાજિત ચોખ્ખો નફો",
            after_deductions: "ભાડું અને કમિશન બાદ કર્યા પછી",
            why_this_mandi: "આ માર્કેટ શા માટે પસંદ કરવું?",
            away: "કિમી દૂર",
            arrival_today: "આવક",
            range_label: "ભાવ રેન્જ",

            top_mandis_title: "ચોખ્ખા નફા મુજબ ટોપ 10 માર્કેટ્સ",
            export_btn: "ડાઉનલોડ",
            col_rank: "ક્રમ",
            col_mandi: "માર્કેટ યાર્ડનું નામ",
            col_price: "મોડલ ભાવ (₹/ક્વિન્ટલ)",
            col_transport: "પરિવહન ખર્ચ",
            col_commission: "કમિશન",
            col_net_return: "ચોખ્ખો નફો",
            col_trend: "7 દિવસનો ટ્રેન્ડ",
            col_action: "વિગત",
            details_btn: "વિગતવાર",
            benchmark_model: "મોડલ ભાવ",

            what_if_title: "રીઅલ-ટાઇમ 'વોટ-ઇફ' સંવેદનશીલતા વિશ્લેષણ",
            what_if_desc: "જથ્થો અને પરિવહન દર બદલીને તરત જ નવો નફો જુઓ:",
            adjust_quantity: "જથ્થો બદલો:",
            adjust_transport: "પરિવહન દર બદલો:",

            chart_price_comp: "ટોપ 10 માર્કેટ યાર્ડના ભાવોની સરખામણી",
            chart_net_breakdown: "ચોખ્ખો નફો વિશ્લેષણ (કુલ આવક સામે ખર્ચ)",
            chart_trend: "30 દિવસનો ભાવ ટ્રેન્ડ",
            chart_route_preview: "ખેતરથી માર્કેટનો રસ્તો",

            modal_commodities_title: "આજે માર્કેટમાં વેચાયેલા પાકો (લાઈવ):",
            modal_all_commodities: "માર્કેટના તમામ પાકો:",
            close_btn: "બંધ કરો",

            atlas_title: "રાષ્ટ્રીય કૃષિ બજાર એટલાસ",
            atlas_subtitle: "ભારતના તમામ એપીએમસી માર્કેટ યાર્ડનો નકશો",
            atlas_search_placeholder: "માર્કેટ, જિલ્લો અથવા રાજ્ય શોધો...",
            atlas_select_commodity: "પાક પસંદ કરો",
            atlas_all_crops: "તમામ પાકો",
            atlas_all_states: "તમામ રાજ્યો",
            atlas_layer_heatmap: "ભાવ હીટમેપ",
            atlas_layer_clusters: "માર્કેટ ક્લસ્ટર્સ",
            atlas_reset_view: "નકશો રીસેટ કરો",
            atlas_national_avg: "રાષ્ટ્રીય સરેરાશ",
            atlas_highest_mandi: "સૌથી ઊંચો ભાવ આપતું માર્કેટ",
            atlas_lowest_mandi: "સૌથી ઓછો ભાવ આપતું માર્કેટ",
            atlas_msp_benchmark: "ટેકાના ભાવ (MSP)",
            atlas_price_spread: "ભાવ તફાવત",

            reports_title: "દૈનિક બજાર ભાવ અહેવાલ",
            reports_subtitle: "સત્તાવાર માર્કેટ આવક અને ભાવ બુલેટિન",
            reports_download_csv: "CSV ડાઉનલોડ",
            reports_print: "પ્રિન્ટ કરો",
            reports_filter_date: "તારીખ પસંદ કરો",
            reports_filter_state: "રાજ્ય મુજબ ફિલ્ટર",
            reports_filter_commodity: "પાક મુજબ ફિલ્ટર",

            live_title: "લાઈવ માર્કેટ ભાવ ફીડ",
            live_auto_refresh: "ઓટો-રીફ્રેશ સમય:",
            live_records_today: "આજના કુલ રેકોર્ડ્સ",
            live_states_reporting: "રિપોર્ટિંગ રાજ્યો",
            live_highest_priced: "સૌથી મોંઘો પાક",
            live_lowest_priced: "સૌથી સસ્તો પાક",
            live_filter_district: "જિલ્લો"
        }
    },

    // Commodity multilingual names mapping
    commodities: {
        "Wheat": { hi: "गेहूं (Wheat)", mr: "गहू (Wheat)", te: "గోధుమలు (Wheat)", pa: "ਕਣਕ (Wheat)", gu: "ઘઉં (Wheat)" },
        "Rice (Paddy)": { hi: "धान / चावल (Paddy)", mr: "भात / तांदूळ (Paddy)", te: "వరి / వడ్లు (Paddy)", pa: "ਝੋਨਾ / ਚੌਲ (Paddy)", gu: "ડાંગર / ચોખા (Paddy)" },
        "Onion": { hi: "प्याज (Onion)", mr: "कांदा (Onion)", te: "ఉల్లిపాయలు (Onion)", pa: "ਗੰਢਾ (Onion)", gu: "ડુંગળી (Onion)" },
        "Tomato": { hi: "टमाटर (Tomato)", mr: "टोमॅटो (Tomato)", te: "టమాట (Tomato)", pa: "ਟਮਾਟਰ (Tomato)", gu: "ટામેટા (Tomato)" },
        "Potato": { hi: "आलू (Potato)", mr: "बटाटा (Potato)", te: "బంగాళాదుంప (Potato)", pa: "ਆਲੂ (Potato)", gu: "બટાકા (Potato)" },
        "Soybean": { hi: "सोयाबीन (Soybean)", mr: "सोयाबीन (Soybean)", te: "సోయాబీన్ (Soybean)", pa: "ਸੋਇਆਬੀਨ (Soybean)", gu: "સોયાબીન (Soybean)" },
        "Cotton": { hi: "कपास (Cotton)", mr: "कापूस (Cotton)", te: "పత్తి (Cotton)", pa: "ਨਰਮਾ / ਕਪਾਹ (Cotton)", gu: "કપાસ (Cotton)" },
        "Mustard": { hi: "सरसों (Mustard)", mr: "मोहरी (Mustard)", te: "ఆవాలు (Mustard)", pa: "ਸਰ੍ਹੋਂ (Mustard)", gu: "રાઈ / સરસવ (Mustard)" },
        "Chana (Gram)": { hi: "चना (Chana)", mr: "हरभरा (Chana)", te: "శనగలు (Chana)", pa: "ਛੋਲੇ (Chana)", gu: "ચણા (Chana)" },
        "Tur (Arhar)": { hi: "अरहर / तूर (Tur)", mr: "तूर (Toor)", te: "కందులు (Tur)", pa: "ਅਰਹਰ (Tur)", gu: "તુવેર (Tuver)" },
        "Moong (Green Gram)": { hi: "मूंग (Moong)", mr: "मूग (Moong)", te: "పెసలు (Moong)", pa: "ਮੂੰਗ (Moong)", gu: "મગ (Moong)" },
        "Urad": { hi: "उड़द (Urad)", mr: "उडीद (Urad)", te: "మినుములు (Urad)", pa: "ਮਾਂਹ (Urad)", gu: "અડદ (Urad)" },
        "Maize": { hi: "मक्का (Maize)", mr: "मका (Maize)", te: "మొక్కజొన్న (Maize)", pa: "ਮੱਕੀ (Maize)", gu: "મકાઈ (Maize)" },
        "Bajra": { hi: "बाजरा (Bajra)", mr: "बाजरी (Bajra)", te: "సజ్జలు (Bajra)", pa: "ਬਾਜਰਾ (Bajra)", gu: "બાજરી (Bajra)" },
        "Jowar": { hi: "ज्वार (Jowar)", mr: "ज्वारी (Jowar)", te: "జొన్నలు (Jowar)", pa: "ਜਵਾਰ (Jowar)", gu: "જુવાર (Jowar)" },
        "Groundnut": { hi: "मूंगफली (Groundnut)", mr: "भुईमूग (Groundnut)", te: "వేరుశనగ (Groundnut)", pa: "ਮੂੰਗਫਲੀ (Groundnut)", gu: "મગફળી (Groundnut)" },
        "Garlic": { hi: "लहसुन (Garlic)", mr: "लसूण (Garlic)", te: "వెల్లుల్లి (Garlic)", pa: "ਲਸਣ (Garlic)", gu: "લસણ (Garlic)" },
        "Ginger": { hi: "अदरक (Ginger)", mr: "आले (Ginger)", te: "అల్లం (Ginger)", pa: "ਅਦਰਕ (Ginger)", gu: "આદુ (Ginger)" },
        "Green Chilli": { hi: "हरी मिर्च (Green Chilli)", mr: "हिरवी मिरची (Chilli)", te: "పచ్చి మిరప (Chilli)", pa: "ਹਰੀ ਮਿਰਚ (Chilli)", gu: "લીલા મરચા (Chilli)" },
        "Turmeric": { hi: "हल्दी (Turmeric)", mr: "हळद (Turmeric)", te: "పసుపు (Turmeric)", pa: "ਹਲਦੀ (Turmeric)", gu: "હળદર (Turmeric)" },
        "Coriander": { hi: "धनिया (Coriander)", mr: "धने / कोथिंबीर", te: "ధనియాలు (Coriander)", pa: "ਧਨੀਆ (Coriander)", gu: "ધાણા (Coriander)" },
        "Cumin (Jeera)": { hi: "जीरा (Cumin)", mr: "जिरे (Jeera)", te: "జీలకర్ర (Cumin)", pa: "ਜੀਰਾ (Jeera)", gu: "જીરું (Jeera)" },
        "Apple": { hi: "सेब (Apple)", mr: "सफरचंद (Apple)", te: "యాపిల్ (Apple)", pa: "ਸੇਬ (Apple)", gu: "સફરજન (Apple)" },
        "Banana": { hi: "केला (Banana)", mr: "केळी (Banana)", te: "అరటి (Banana)", pa: "ਕੇਲਾ (Banana)", gu: "કેળા (Banana)" },
        "Mango": { hi: "आम (Mango)", mr: "आंबा (Mango)", te: "మామిడి (Mango)", pa: "ਅੰਬ (Mango)", gu: "કેરી (Mango)" },
        "Sugarcane": { hi: "गन्ना (Sugarcane)", mr: "ऊस (Sugarcane)", te: "చెరకు (Sugarcane)", pa: "ਗੰਨਾ (Sugarcane)", gu: "શેરડી (Sugarcane)" }
    },

    init() {
        const saved = localStorage.getItem('mandi_lang');
        if (saved && this.translations[saved]) {
            this.currentLang = saved;
        } else {
            this.currentLang = 'en';
        }

        this.injectLanguageDropdown();
        this.applyTranslations();
    },

    setLanguage(lang) {
        if (!this.translations[lang]) return;
        this.currentLang = lang;
        localStorage.setItem('mandi_lang', lang);
        this.applyTranslations();

        // Dispatch language change event for other JS modules (app.js, atlas.js, live.js)
        window.dispatchEvent(new CustomEvent('mandiLanguageChanged', { detail: { lang } }));
    },

    t(key) {
        const langData = this.translations[this.currentLang] || this.translations['en'];
        return langData[key] || this.translations['en'][key] || key;
    },

    getCommodityName(origName) {
        if (this.currentLang === 'en') return origName;
        const entry = this.commodities[origName];
        if (entry && entry[this.currentLang]) {
            return entry[this.currentLang];
        }
        // Try partial match
        for (const [key, val] of Object.entries(this.commodities)) {
            if (origName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(origName.toLowerCase())) {
                if (val[this.currentLang]) return val[this.currentLang];
            }
        }
        return origName;
    },

    applyTranslations() {
        const lang = this.currentLang;
        const dict = this.translations[lang] || this.translations['en'];

        // 1. Text elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                el.textContent = dict[key];
            }
        });

        // 2. Placeholders with data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dict[key]) {
                el.placeholder = dict[key];
            }
        });

        // 3. Dropdown synchronizer
        const selector = document.getElementById('mandi-lang-select');
        if (selector && selector.value !== lang) {
            selector.value = lang;
        }

        const mobileSelector = document.getElementById('mobile-mandi-lang-select');
        if (mobileSelector && mobileSelector.value !== lang) {
            mobileSelector.value = lang;
        }

        // 4. Update document title
        if (dict.app_title) {
            document.title = dict.app_title + " | Smart Mandi";
        }
    },

    injectLanguageDropdown() {
        // Look for desktop nav to inject language selector if not present
        const desktopNav = document.querySelector('header nav, nav .hidden.md\\:block .ml-10');
        if (desktopNav && !document.getElementById('mandi-lang-select')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'relative inline-flex items-center ml-2';
            wrapper.innerHTML = `
                <select id="mandi-lang-select" class="bg-black/30 hover:bg-black/50 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 border border-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer transition-all shadow-xs" title="Change Language / भाषा बदलें">
                    ${Object.entries(this.languages).map(([code, meta]) => `
                        <option value="${code}" ${code === this.currentLang ? 'selected' : ''} class="bg-gray-900 text-white">
                            ${meta.flag} ${meta.name}
                        </option>
                    `).join('')}
                </select>
            `;
            desktopNav.appendChild(wrapper);

            wrapper.querySelector('#mandi-lang-select').addEventListener('change', (e) => {
                this.setLanguage(e.target.value);
            });
        }

        // Mobile nav injection
        const mobileNav = document.getElementById('mobile-nav') || document.querySelector('.mobile-menu');
        if (mobileNav && !document.getElementById('mobile-mandi-lang-select')) {
            const mobileWrapper = document.createElement('div');
            mobileWrapper.className = 'px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs text-white';
            mobileWrapper.innerHTML = `
                <span class="font-bold flex items-center"><i class="fa-solid fa-globe mr-1.5 text-amber-300"></i> Language:</span>
                <select id="mobile-mandi-lang-select" class="bg-black/40 text-white text-xs font-bold rounded-md px-2 py-1 border border-white/20">
                    ${Object.entries(this.languages).map(([code, meta]) => `
                        <option value="${code}" ${code === this.currentLang ? 'selected' : ''} class="bg-gray-900 text-white">
                            ${meta.flag} ${meta.name}
                        </option>
                    `).join('')}
                </select>
            `;
            mobileNav.appendChild(mobileWrapper);

            mobileWrapper.querySelector('#mobile-mandi-lang-select').addEventListener('change', (e) => {
                this.setLanguage(e.target.value);
            });
        }
    }
};

// Auto initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    MandiI18n.init();
});
