"""
Script to seed data/live_cache.json with realistic daily mandi price data
across ALL states and districts of India, following the exact schema of data.gov.in / AGMARKNET.
"""

import json
import os
import time
import random
from datetime import datetime

def generate_pan_india_live_data():
    random.seed(101)  # Consistent seed

    today_str = datetime.today().strftime("%d/%m/%Y")

    # Major commodity profiles with typical price ranges (INR per Quintal)
    commodities = [
        {"name": "Wheat", "variety": "Dara", "grade": "FAQ", "min_range": (2150, 2250), "modal_range": (2275, 2450), "max_range": (2450, 2600)},
        {"name": "Rice (Paddy)", "variety": "Common", "grade": "FAQ", "min_range": (2050, 2180), "modal_range": (2200, 2380), "max_range": (2400, 2650)},
        {"name": "Basmati Rice", "variety": "1121", "grade": "Super", "min_range": (3600, 4000), "modal_range": (4200, 4800), "max_range": (5000, 5600)},
        {"name": "Onion", "variety": "Red", "grade": "FAQ", "min_range": (1400, 1800), "modal_range": (2100, 2600), "max_range": (2700, 3200)},
        {"name": "Tomato", "variety": "Local / Hybrid", "grade": "FAQ", "min_range": (1200, 1600), "modal_range": (1800, 2400), "max_range": (2500, 3000)},
        {"name": "Potato", "variety": "Jyoti / Desi", "grade": "FAQ", "min_range": (1100, 1350), "modal_range": (1500, 1800), "max_range": (1850, 2150)},
        {"name": "Soybean", "variety": "Yellow", "grade": "FAQ", "min_range": (4300, 4550), "modal_range": (4700, 5050), "max_range": (5100, 5400)},
        {"name": "Cotton", "variety": "Medium Staple", "grade": "FAQ", "min_range": (6400, 6700), "modal_range": (6900, 7350), "max_range": (7400, 7850)},
        {"name": "Mustard", "variety": "Mustard Bold", "grade": "FAQ", "min_range": (5200, 5450), "modal_range": (5650, 6000), "max_range": (6100, 6400)},
        {"name": "Chana (Gram)", "variety": "Desi", "grade": "FAQ", "min_range": (5300, 5550), "modal_range": (5750, 6100), "max_range": (6200, 6600)},
        {"name": "Tur (Arhar)", "variety": "White / Red", "grade": "FAQ", "min_range": (7100, 7600), "modal_range": (7900, 8500), "max_range": (8600, 9200)},
        {"name": "Moong (Green Gram)", "variety": "Shining", "grade": "FAQ", "min_range": (7800, 8200), "modal_range": (8500, 9100), "max_range": (9200, 9700)},
        {"name": "Maize", "variety": "Yellow", "grade": "FAQ", "min_range": (1950, 2100), "modal_range": (2180, 2350), "max_range": (2400, 2550)},
        {"name": "Bajra", "variety": "Desi", "grade": "FAQ", "min_range": (2100, 2300), "modal_range": (2450, 2650), "max_range": (2700, 2900)},
        {"name": "Jowar", "variety": "White", "grade": "FAQ", "min_range": (2800, 3050), "modal_range": (3200, 3500), "max_range": (3600, 3900)},
        {"name": "Groundnut", "variety": "Bold", "grade": "FAQ", "min_range": (6000, 6300), "modal_range": (6500, 6950), "max_range": (7100, 7500)},
        {"name": "Garlic", "variety": "Desi", "grade": "Medium", "min_range": (7500, 8500), "modal_range": (9500, 12000), "max_range": (12500, 15000)},
        {"name": "Ginger", "variety": "Green Ginger", "grade": "FAQ", "min_range": (6500, 7500), "modal_range": (8200, 9500), "max_range": (9800, 11500)},
        {"name": "Green Chilli", "variety": "G4", "grade": "FAQ", "min_range": (2800, 3400), "modal_range": (3800, 4800), "max_range": (5000, 6000)},
        {"name": "Turmeric", "variety": "Finger", "grade": "FAQ", "min_range": (9500, 11000), "modal_range": (12500, 14500), "max_range": (15000, 17500)},
        {"name": "Coriander", "variety": "Badami", "grade": "FAQ", "min_range": (6800, 7500), "modal_range": (8200, 9200), "max_range": (9500, 10800)},
        {"name": "Cumin (Jeera)", "variety": "Machine Clean", "grade": "Special", "min_range": (22000, 24000), "modal_range": (26000, 29500), "max_range": (30000, 33000)},
        {"name": "Apple", "variety": "Delicious", "grade": "Medium", "min_range": (6000, 7500), "modal_range": (8500, 10500), "max_range": (11000, 13500)},
        {"name": "Banana", "variety": "Robusta", "grade": "FAQ", "min_range": (1400, 1800), "modal_range": (2100, 2600), "max_range": (2700, 3300)},
        {"name": "Mango", "variety": "Kesar / Alphonso", "grade": "FAQ", "min_range": (4500, 5500), "modal_range": (6500, 8500), "max_range": (9000, 12000)},
        {"name": "Brinjal", "variety": "Round", "grade": "FAQ", "min_range": (1200, 1500), "modal_range": (1700, 2200), "max_range": (2300, 2800)},
        {"name": "Cabbage", "variety": "Green", "grade": "FAQ", "min_range": (900, 1200), "modal_range": (1350, 1700), "max_range": (1800, 2200)},
        {"name": "Cauliflower", "variety": "Snowball", "grade": "FAQ", "min_range": (1100, 1400), "modal_range": (1600, 2100), "max_range": (2200, 2700)},
        {"name": "Lady Finger (Bhindi)", "variety": "Hybrid", "grade": "FAQ", "min_range": (1800, 2200), "modal_range": (2500, 3200), "max_range": (3400, 4000)},
        {"name": "Sugarcane", "variety": "Co 0238", "grade": "FAQ", "min_range": (320, 340), "modal_range": (360, 390), "max_range": (400, 430)}
    ]

    # Detailed State -> District -> Markets mapping covering all Indian regions
    geographies = {
        "Maharashtra": {
            "Nashik": ["Lasalgaon APMC", "Pimpalgaon APMC", "Nashik Main APMC", "Yeola APMC", "Malegaon APMC", "Sinnar APMC"],
            "Pune": ["Pune (Gultekdi) APMC", "Baramati APMC", "Manchar APMC", "Shirur APMC", "Khed APMC"],
            "Mumbai": ["Vashi (Turbhe) APMC", "Dadar Market"],
            "Nagpur": ["Nagpur (Kalamna) APMC", "Katol APMC", "Umred APMC"],
            "Jalgaon": ["Jalgaon APMC", "Raver APMC", "Bhusawal APMC", "Chalisgaon APMC"],
            "Ahmednagar": ["Ahmednagar APMC", "Rahuri APMC", "Sangamner APMC", "Kopargaon APMC", "Shrirampur APMC"],
            "Solapur": ["Solapur APMC", "Karmala APMC", "Barshi APMC", "Pandharpur APMC"],
            "Kolhapur": ["Kolhapur (Shahupuri) APMC", "Jaysingpur APMC", "Gadhinglaj APMC"],
            "Aurangabad": ["Aurangabad (Jadhavwadi) APMC", "Gangapur APMC", "Paithan APMC", "Vaijapur APMC"],
            "Amravati": ["Amravati APMC", "Achalpur APMC", "Morshi APMC", "Warud APMC"],
            "Nanded": ["Nanded APMC", "Loha APMC", "Mukhed APMC"],
            "Sangli": ["Sangli (Market Yard) APMC", "Tasgaon APMC", "Vita APMC"],
            "Satara": ["Satara APMC", "Karad APMC", "Phaltan APMC", "Wai APMC"],
            "Latur": ["Latur APMC", "Ausa APMC", "Udgir APMC", "Ahmedpur APMC"],
            "Beed": ["Beed APMC", "Georai APMC", "Parli APMC", "Majalgaon APMC"]
        },
        "Uttar Pradesh": {
            "Agra": ["Agra APMC", "Fatehabad APMC", "Shamsabad APMC", "Achhnera APMC"],
            "Kanpur": ["Kanpur (Chakeri) APMC", "Kanpur (Grain)", "Baripal APMC"],
            "Lucknow": ["Lucknow (Dubagga) APMC", "Naveen Mandi Sthal", "Mohanlalganj APMC"],
            "Varanasi": ["Varanasi APMC", "Rohania Mandi", "Ramnagar APMC"],
            "Meerut": ["Meerut Main APMC", "Sardhana APMC", "Mawana APMC"],
            "Aligarh": ["Aligarh APMC", "Khair APMC", "Atrauli APMC", "Iglas APMC"],
            "Gonda": ["Colonelganj APMC", "Gonda Naveen Mandi", "Nawabganj APMC"],
            "Bareilly": ["Bareilly APMC", "Baheri APMC", "Aonla APMC", "Faridpur APMC"],
            "Prayagraj": ["Prayagraj (Mundera) APMC", "Jasra APMC", "Sirathu Mandi"],
            "Gorakhpur": ["Gorakhpur APMC", "Sahjanwa APMC", "Chauri Chaura APMC"],
            "Mathura": ["Mathura APMC", "Kosi Kalan APMC", "Chhata APMC"],
            "Moradabad": ["Moradabad APMC", "Chandausi APMC", "Sambhal APMC"],
            "Muzaffarnagar": ["Muzaffarnagar APMC", "Khatauli APMC", "Shamli APMC"]
        },
        "Madhya Pradesh": {
            "Indore": ["Indore (Choithram) APMC", "Indore (Laxmibai Nagar)", "Sanwer APMC"],
            "Bhopal": ["Bhopal (Karond) APMC", "Berasia APMC"],
            "Ujjain": ["Ujjain (Chimanganj) APMC", "Nagda APMC", "Mahidpur APMC", "Tarana APMC"],
            "Mandsaur": ["Mandsaur APMC", "Daloda APMC", "Piplia APMC", "Garoth APMC"],
            "Sagar": ["Sagar APMC", "Bina APMC", "Khurai APMC", "Rehli APMC"],
            "Jabalpur": ["Jabalpur (Krishi Upaj Mandi)", "Sihora APMC", "Patan APMC"],
            "Gwalior": ["Gwalior (Lashkar) APMC", "Dabra APMC", "Morar APMC"],
            "Dewas": ["Dewas APMC", "Sonkatch APMC", "Kannod APMC", "Bagli APMC"],
            "Ratlam": ["Ratlam APMC", "Jaora APMC", "Sailana APMC", "Alote APMC"],
            "Neemuch": ["Neemuch APMC", "Manasa APMC", "Jawad APMC"]
        },
        "Punjab": {
            "Ludhiana": ["Ludhiana Main APMC", "Khanna APMC", "Jagraon APMC", "Mullanpur APMC"],
            "Amritsar": ["Amritsar (Bhagtanwala) APMC", "Rayya APMC", "Ajnala APMC"],
            "Bathinda": ["Bathinda APMC", "Rampura Phul APMC", "Talwandi Sabo APMC", "Maur Mandi"],
            "Jalandhar": ["Jalandhar Cantt APMC", "Goraya APMC", "Nakodar APMC", "Kartarpur APMC"],
            "Patiala": ["Patiala APMC", "Nabha APMC", "Samana APMC", "Rajpura APMC"],
            "Sangrur": ["Sangrur APMC", "Sunam APMC", "Malerkotla APMC", "Dhuri APMC"],
            "Firozpur": ["Firozpur City APMC", "Zira APMC", "Guruharsahai APMC"]
        },
        "Haryana": {
            "Karnal": ["Karnal Grain APMC", "Taraori APMC", "Gharaunda APMC", "Assandh APMC"],
            "Hisar": ["Hisar APMC", "Hansi APMC", "Barwala APMC", "Uklana APMC"],
            "Ambala": ["Ambala City APMC", "Ambala Cantt APMC", "Barara APMC", "Naraingarh APMC"],
            "Rohtak": ["Rohtak APMC", "Meham APMC", "Sampla APMC"],
            "Sirsa": ["Sirsa APMC", "Dabwali APMC", "Ellenabad APMC", "Kalanwali APMC"],
            "Panipat": ["Panipat APMC", "Samalkha APMC", "Madlauda APMC"],
            "Sonipat": ["Sonipat APMC", "Ganaur APMC", "Gohana APMC", "Kharkhoda APMC"],
            "Kurukshetra": ["Kurukshetra (Pipli) APMC", "Shahabad APMC", "Pehowa APMC", "Ladwa APMC"]
        },
        "Gujarat": {
            "Rajkot": ["Rajkot APMC", "Gondal APMC", "Jetpur APMC", "Dhoraji APMC", "Jasdan APMC"],
            "Mehsana": ["Unjha APMC", "Mehsana APMC", "Visnagar APMC", "Kadi APMC"],
            "Ahmedabad": ["Ahmedabad (Jamalpur) APMC", "Sanand APMC", "Bavla APMC", "Viramgam APMC"],
            "Surat": ["Surat APMC", "Bardoli APMC", "Mandvi APMC", "Vyara APMC"],
            "Bhavnagar": ["Bhavnagar APMC", "Mahuva APMC", "Talaja APMC", "Palitana APMC"],
            "Amreli": ["Amreli APMC", "Babra APMC", "Savarkundla APMC", "Dhari APMC"],
            "Junagadh": ["Junagadh APMC", "Keshod APMC", "Visavadar APMC", "Manavadar APMC"]
        },
        "Rajasthan": {
            "Jaipur": ["Jaipur (Muhana) APMC", "Jaipur (Surajpole)", "Chomu APMC", "Kotputli APMC"],
            "Jodhpur": ["Jodhpur (Mandore) APMC", "Jodhpur (Basni)", "Piparcity APMC", "Bilara APMC"],
            "Kota": ["Kota (Bhamashah Mandi) APMC", "Ramganj Mandi APMC", "Itawa APMC"],
            "Bikaner": ["Bikaner APMC", "Nokha APMC", "Lunkaransar APMC", "Sridungargarh APMC"],
            "Sri Ganganagar": ["Sri Ganganagar APMC", "Suratgarh APMC", "Padampur APMC", "Gajsinghpur APMC"],
            "Alwar": ["Alwar APMC", "Khairthal APMC", "Kherli APMC", "Rajgarh APMC"],
            "Nagaur": ["Nagaur APMC", "Merta City APMC", "Didwana APMC", "Kuchaman City APMC"]
        },
        "Karnataka": {
            "Bangalore": ["APMC Yeshwanthpur (Bengaluru)", "APMC Binny Mill", "K.R. Market"],
            "Belagavi": ["Belagavi APMC", "Bailhongal APMC", "Gokak APMC", "Chikkodi APMC"],
            "Dharwad": ["Hubli (Amargol) APMC", "Dharwad APMC", "Kalghatgi APMC"],
            "Mysore": ["Mysore (Bandipalya) APMC", "Nanjangud APMC", "Hunsur APMC"],
            "Davanagere": ["Davanagere APMC", "Harihar APMC", "Channagiri APMC"],
            "Ballari": ["Ballari APMC", "Hospet APMC", "Siruguppa APMC", "Kudligi APMC"],
            "Kolar": ["Kolar APMC (Tomato Market)", "Bangarapet APMC", "Mulbagal APMC"]
        },
        "Andhra Pradesh": {
            "Guntur": ["Guntur (Mirchi Yard) APMC", "Tenali APMC", "Narasaraopet APMC", "Mangalagiri APMC"],
            "Kurnool": ["Kurnool APMC", "Adoni APMC", "Yemmiganur APMC", "Nandyal APMC"],
            "Krishna": ["Vijayawada APMC", "Gudivada APMC", "Machilipatnam APMC", "Jaggayyapet APMC"],
            "East Godavari": ["Rajahmundry APMC", "Kakinada APMC", "Amalapuram APMC", "Mandapeta APMC"],
            "Chittoor": ["Chittoor APMC", "Madanapalle APMC (Tomato)", "Tirupati APMC", "Palamaner APMC"]
        },
        "Telangana": {
            "Hyderabad": ["Bowenpally APMC", "Malakpet APMC", "Gudimalkapur APMC", "L.B. Nagar APMC"],
            "Nizamabad": ["Nizamabad APMC (Turmeric Market)", "Bodhan APMC", "Armoor APMC"],
            "Warangal": ["Warangal (Enumamula) APMC", "Jangaon APMC", "Narsampet APMC", "Mahabubabad APMC"],
            "Khammam": ["Khammam APMC", "Madhira APMC", "Kothagudem APMC", "Sathupally APMC"],
            "Karimnagar": ["Karimnagar APMC", "Jagtial APMC", "Huzurabad APMC", "Choppadandi APMC"]
        },
        "Tamil Nadu": {
            "Chennai": ["Koyambedu Wholesale Market Complex", "Madhavaram Market"],
            "Coimbatore": ["Coimbatore (MGR Market) APMC", "Pollachi APMC", "Mettupalayam APMC"],
            "Madurai": ["Madurai (Paravai) APMC", "Mattuthavani Market", "Melur APMC"],
            "Tiruchirappalli": ["Trichy (Gandhi Market) APMC", "Manachanallur APMC", "Thuraiyur APMC"],
            "Salem": ["Salem (Leigh Bazaar) APMC", "Attur APMC", "Mecheri APMC", "Sankagiri APMC"],
            "Erode": ["Erode APMC (Turmeric Yard)", "Perundurai APMC", "Gobichettipalayam APMC"]
        },
        "West Bengal": {
            "Kolkata": ["Posta Bazar", "Koley Market", "Mechua Fruit Market"],
            "Darjeeling": ["Siliguri Regulated Market", "Darjeeling Town Market"],
            "Burdwan": ["Burdwan APMC", "Kalna APMC", "Memari APMC", "Katwa APMC"],
            "Hooghly": ["Sheoraphuli APMC", "Chinsurah APMC", "Tarakeswar APMC"],
            "Nadia": ["Ranaghat APMC", "Krishnanagar APMC", "Bethuadahari APMC"]
        },
        "Bihar": {
            "Patna": ["Patna (Anta Ghat)", "Bazar Samiti Patna", "Mithapur Market"],
            "Muzaffarpur": ["Muzaffarpur Bazar Samiti", "Kanti APMC"],
            "Gaya": ["Gaya Bazar Samiti", "Tekari Mandi"],
            "Bhagalpur": ["Bhagalpur APMC", "Naugachia APMC"],
            "Purnia": ["Gulabbagh Mandi Purnia", "Kasba APMC"]
        },
        "Odisha": {
            "Bhubaneswar": ["Bhubaneswar Unit-1 Market", "Aiginia Wholesale Market"],
            "Cuttack": ["Chhatra Bazar Cuttack", "Malgodown Market"],
            "Sambalpur": ["Sambalpur RMC", "Bargarh RMC", "Attabira RMC"]
        },
        "Kerala": {
            "Ernakulam": ["Ernakulam Broadway Market", "Aluva Market", "Kaloor Market"],
            "Kozhikode": ["Palayam Market Kozhikode", "Valayanad Market"],
            "Thiruvananthapuram": ["Chalappuram Market", "Palayam Connemara Market"]
        },
        "Himachal Pradesh": {
            "Shimla": ["Dhalli APMC Shimla", "Theog APMC", "Rohru APMC"],
            "Kullu": ["Kullu (Bajaura) APMC", "Manali Market"],
            "Solan": ["Solan APMC (Fruit & Vegetable)", "Parwanoo APMC"]
        },
        "Jammu and Kashmir": {
            "Srinagar": ["Parimpora Fruit & Vegetable Mandi", "Batamaloo Market"],
            "Jammu": ["Narwal Fruit & Vegetable Mandi", "Nai Basti Market"],
            "Baramulla": ["Sopore Fruit Mandi (Apple Capital)"]
        },
        "Delhi": {
            "Delhi": ["Azadpur APMC", "Ghazipur Fruit & Vegetable Mandi", "Okhla APMC", "Narela APMC", "Najafgarh APMC"]
        }
    }

    records = []

    for state, districts in geographies.items():
        for district, markets in districts.items():
            for market in markets:
                # Each market trades 6 to 14 representative commodities
                num_comms = random.randint(6, 14)
                sampled_comms = random.sample(commodities, num_comms)

                for comm in sampled_comms:
                    min_p = random.randint(*comm["min_range"])
                    modal_p = random.randint(max(min_p, comm["modal_range"][0]), comm["modal_range"][1])
                    max_p = random.randint(max(modal_p, comm["max_range"][0]), comm["max_range"][1])

                    # Minor geographic adjustments (e.g. Apples cheaper in Himachal/Kashmir, Onions cheaper in Nashik)
                    if comm["name"] == "Onion" and state == "Maharashtra":
                        min_p = int(min_p * 0.85)
                        modal_p = int(modal_p * 0.85)
                        max_p = int(max_p * 0.85)
                    elif comm["name"] == "Apple" and state in ["Himachal Pradesh", "Jammu and Kashmir"]:
                        min_p = int(min_p * 0.65)
                        modal_p = int(modal_p * 0.70)
                        max_p = int(max_p * 0.75)
                    elif comm["name"] == "Wheat" and state in ["Punjab", "Haryana", "Madhya Pradesh"]:
                        modal_p = int(modal_p * 0.95)
                    elif comm["name"] == "Turmeric" and market.startswith("Nizamabad") or market.startswith("Erode"):
                        modal_p = int(modal_p * 0.90)
                    elif comm["name"] == "Cumin (Jeera)" and "Unjha" in market:
                        modal_p = int(modal_p * 0.92)

                    records.append({
                        "state": state,
                        "district": district,
                        "market": market,
                        "commodity": comm["name"],
                        "variety": comm["variety"],
                        "grade": comm["grade"],
                        "arrival_date": today_str,
                        "min_price": str(min_p),
                        "max_price": str(max_p),
                        "modal_price": str(modal_p)
                    })

    data_dir = os.path.dirname(os.path.abspath(__file__))
    cache_path = os.path.join(data_dir, "live_cache.json")

    cache_data = {
        "timestamp": time.time(),
        "data": records
    }

    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(cache_data, f, indent=2)

    print(f"Generated {len(records)} realistic pan-India daily mandi records across {len(geographies)} states!")
    print(f"Saved to: {cache_path}")
    return len(records)

if __name__ == "__main__":
    generate_pan_india_live_data()
