import json
import random
import os
from datetime import datetime, timedelta

def generate_data():
    random.seed(42)  # For reproducibility

    # Define commodities
    commodities_list = [
        {"id": "C01", "name": "Wheat", "category": "Cereals", "unit": "Quintal", "msp": 2275},
        {"id": "C02", "name": "Rice (Paddy)", "category": "Cereals", "unit": "Quintal", "msp": 2183},
        {"id": "C03", "name": "Onion", "category": "Vegetables", "unit": "Quintal", "msp": None},
        {"id": "C04", "name": "Tomato", "category": "Vegetables", "unit": "Quintal", "msp": None},
        {"id": "C05", "name": "Potato", "category": "Vegetables", "unit": "Quintal", "msp": None},
        {"id": "C06", "name": "Soybean", "category": "Oilseeds", "unit": "Quintal", "msp": 4600},
        {"id": "C07", "name": "Cotton", "category": "Cash Crops", "unit": "Quintal", "msp": 6620},
        {"id": "C08", "name": "Chana (Gram)", "category": "Pulses", "unit": "Quintal", "msp": 5440},
        {"id": "C09", "name": "Tur (Arhar)", "category": "Pulses", "unit": "Quintal", "msp": 7000},
        {"id": "C10", "name": "Moong", "category": "Pulses", "unit": "Quintal", "msp": 8558},
        {"id": "C11", "name": "Urad", "category": "Pulses", "unit": "Quintal", "msp": 6950},
        {"id": "C12", "name": "Maize", "category": "Cereals", "unit": "Quintal", "msp": 2090},
        {"id": "C13", "name": "Bajra", "category": "Cereals", "unit": "Quintal", "msp": 2500},
        {"id": "C14", "name": "Jowar", "category": "Cereals", "unit": "Quintal", "msp": 3180},
        {"id": "C15", "name": "Groundnut", "category": "Oilseeds", "unit": "Quintal", "msp": 6377},
        {"id": "C16", "name": "Mustard", "category": "Oilseeds", "unit": "Quintal", "msp": 5650},
        {"id": "C17", "name": "Sunflower", "category": "Oilseeds", "unit": "Quintal", "msp": 6760},
        {"id": "C18", "name": "Sugarcane", "category": "Cash Crops", "unit": "Quintal", "msp": 315},
        {"id": "C19", "name": "Garlic", "category": "Spices", "unit": "Quintal", "msp": None},
        {"id": "C20", "name": "Ginger", "category": "Spices", "unit": "Quintal", "msp": None},
        {"id": "C21", "name": "Green Chilli", "category": "Vegetables", "unit": "Quintal", "msp": None},
        {"id": "C22", "name": "Banana", "category": "Fruits", "unit": "Quintal", "msp": None},
        {"id": "C23", "name": "Apple", "category": "Fruits", "unit": "Quintal", "msp": None},
        {"id": "C24", "name": "Mango", "category": "Fruits", "unit": "Quintal", "msp": None},
        {"id": "C25", "name": "Turmeric", "category": "Spices", "unit": "Quintal", "msp": None},
        {"id": "C26", "name": "Coriander", "category": "Spices", "unit": "Quintal", "msp": None},
        {"id": "C27", "name": "Cumin", "category": "Spices", "unit": "Quintal", "msp": None},
        {"id": "C28", "name": "Brinjal", "category": "Vegetables", "unit": "Quintal", "msp": None},
        {"id": "C29", "name": "Cauliflower", "category": "Vegetables", "unit": "Quintal", "msp": None},
        {"id": "C30", "name": "Cabbage", "category": "Vegetables", "unit": "Quintal", "msp": None},
        {"id": "C31", "name": "Lady Finger", "category": "Vegetables", "unit": "Quintal", "msp": None}
    ]

    base_prices = {
        "C01": 2200, "C02": 2500, "C03": 1800, "C04": 2000, "C05": 1500,
        "C06": 4800, "C07": 7000, "C08": 5600, "C09": 7500, "C10": 8800,
        "C11": 7200, "C12": 2100, "C13": 2400, "C14": 3000, "C15": 6500,
        "C16": 5800, "C17": 6800, "C18": 320, "C19": 8000, "C20": 9000,
        "C21": 3500, "C22": 1500, "C23": 8000, "C24": 5000, "C25": 7000,
        "C26": 8500, "C27": 25000, "C28": 1800, "C29": 1600, "C30": 1400,
        "C31": 2200
    }

    # Define 50+ Markets
    markets_data = [
        ("M01", "Azadpur", "New Delhi", "Delhi", 28.73, 77.17, 5),
        ("M02", "Vashi", "Mumbai", "Maharashtra", 19.07, 73.00, 5),
        ("M03", "Lasalgaon", "Nashik", "Maharashtra", 20.14, 74.23, 4),
        ("M04", "Mandsaur", "Mandsaur", "Madhya Pradesh", 24.07, 75.07, 4),
        ("M05", "Unjha", "Mehsana", "Gujarat", 23.80, 72.39, 5),
        ("M06", "Kurnool", "Kurnool", "Andhra Pradesh", 15.82, 78.03, 4),
        ("M07", "Pune (Gultekdi)", "Pune", "Maharashtra", 18.50, 73.86, 5),
        ("M08", "Indore (Choithram)", "Indore", "Madhya Pradesh", 22.70, 75.86, 5),
        ("M09", "Nagpur (Kalamna)", "Nagpur", "Maharashtra", 21.16, 79.13, 4),
        ("M10", "Guntur", "Guntur", "Andhra Pradesh", 16.30, 80.43, 5),
        ("M11", "Koyambedu", "Chennai", "Tamil Nadu", 13.06, 80.19, 5),
        ("M12", "APMC Bangalore", "Bangalore", "Karnataka", 13.01, 77.54, 5),
        ("M13", "Ghazipur", "Delhi", "Delhi", 28.62, 77.32, 4),
        ("M14", "Agra", "Agra", "Uttar Pradesh", 27.17, 78.00, 3),
        ("M15", "Kanpur", "Kanpur", "Uttar Pradesh", 26.44, 80.33, 4),
        ("M16", "Lucknow", "Lucknow", "Uttar Pradesh", 26.84, 80.94, 4),
        ("M17", "Gondal", "Rajkot", "Gujarat", 21.96, 70.79, 4),
        ("M18", "Rajkot", "Rajkot", "Gujarat", 22.30, 70.80, 4),
        ("M19", "Jaipur (Muhana)", "Jaipur", "Rajasthan", 26.83, 75.76, 5),
        ("M20", "Jodhpur", "Jodhpur", "Rajasthan", 26.23, 73.02, 3),
        ("M21", "Kota", "Kota", "Rajasthan", 25.18, 75.83, 4),
        ("M22", "Bhatinda", "Bhatinda", "Punjab", 30.21, 74.94, 4),
        ("M23", "Ludhiana", "Ludhiana", "Punjab", 30.90, 75.85, 4),
        ("M24", "Amritsar", "Amritsar", "Punjab", 31.63, 74.87, 3),
        ("M25", "Karnal", "Karnal", "Haryana", 29.68, 76.99, 4),
        ("M26", "Hisar", "Hisar", "Haryana", 29.14, 75.72, 3),
        ("M27", "Posta Bazar", "Kolkata", "West Bengal", 22.58, 88.35, 4),
        ("M28", "Siliguri", "Darjeeling", "West Bengal", 26.72, 88.39, 3),
        ("M29", "Patna", "Patna", "Bihar", 25.59, 85.13, 3),
        ("M30", "Muzaffarpur", "Muzaffarpur", "Bihar", 26.11, 85.39, 3),
        ("M31", "Nizamabad", "Nizamabad", "Telangana", 18.67, 78.09, 4),
        ("M32", "Bowenpally", "Hyderabad", "Telangana", 17.47, 78.48, 5),
        ("M33", "Warangal", "Warangal", "Telangana", 17.96, 79.59, 4),
        ("M34", "Ujjain", "Ujjain", "Madhya Pradesh", 23.17, 75.78, 3),
        ("M35", "Sagar", "Sagar", "Madhya Pradesh", 23.83, 78.71, 3),
        ("M36", "Jalgaon", "Jalgaon", "Maharashtra", 21.00, 75.56, 4),
        ("M37", "Solapur", "Solapur", "Maharashtra", 17.67, 75.90, 4),
        ("M38", "Nashik", "Nashik", "Maharashtra", 19.99, 73.78, 4),
        ("M39", "Sangli", "Sangli", "Maharashtra", 16.85, 74.58, 4),
        ("M40", "Navi Mumbai", "Thane", "Maharashtra", 19.03, 73.02, 5),
        ("M41", "Hubli", "Dharwad", "Karnataka", 15.36, 75.12, 4),
        ("M42", "Belagavi", "Belagavi", "Karnataka", 15.84, 74.50, 3),
        ("M43", "Mysore", "Mysore", "Karnataka", 12.29, 76.64, 4),
        ("M44", "Coimbatore", "Coimbatore", "Tamil Nadu", 11.01, 76.95, 4),
        ("M45", "Madurai", "Madurai", "Tamil Nadu", 9.92, 78.11, 4),
        ("M46", "Trichy", "Tiruchirappalli", "Tamil Nadu", 10.79, 78.70, 3),
        ("M47", "Bhavnagar", "Bhavnagar", "Gujarat", 21.76, 72.15, 3),
        ("M48", "Amreli", "Amreli", "Gujarat", 21.60, 71.22, 3),
        ("M49", "Meerut", "Meerut", "Uttar Pradesh", 28.98, 77.70, 4),
        ("M50", "Varanasi", "Varanasi", "Uttar Pradesh", 25.31, 82.97, 4),
        ("M51", "Aligarh", "Aligarh", "Uttar Pradesh", 27.89, 78.08, 3)
    ]

    markets_list = []
    for m_id, name, district, state, lat, lng, rating in markets_data:
        markets_list.append({
            "id": m_id,
            "name": name,
            "district": district,
            "state": state,
            "lat": lat,
            "lng": lng,
            "commission_rate": round(random.uniform(1.0, 3.0), 1),
            "infrastructure_rating": rating
        })

    # Generate Prices for last 90 days
    today = datetime.today()
    dates = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(90)]
    
    prices_list = []
    
    # Assign specific commodities to markets (~60% coverage)
    for market in markets_list:
        # Determine market size
        market_size = market["infrastructure_rating"] # 3 to 5
        
        # Select random commodities for this market
        num_commodities = int(len(commodities_list) * random.uniform(0.4, 0.8))
        market_commodities = random.sample(commodities_list, num_commodities)
        
        for comm in market_commodities:
            base_price = base_prices[comm["id"]]
            
            # Create a market-specific price trend and volatility
            trend_slope = random.uniform(-5.0, 5.0)
            volatility = random.uniform(0.01, 0.05)
            
            # Generate 90 days of data
            current_price = base_price + random.uniform(-base_price*0.1, base_price*0.1)
            
            for day_index, date_str in enumerate(reversed(dates)): # oldest to newest
                # Day-to-day price movement
                current_price += trend_slope + (current_price * random.uniform(-volatility, volatility))
                
                # Introduce occasional spikes
                if random.random() < 0.02:
                    current_price *= random.uniform(1.1, 1.3) # Spike up
                elif random.random() < 0.02:
                    current_price *= random.uniform(0.75, 0.9) # Spike down
                
                # Ensure price doesn't go below a reasonable threshold (e.g., 20% of base)
                current_price = max(current_price, base_price * 0.2)
                
                modal_price = int(current_price)
                min_price = int(modal_price * random.uniform(0.85, 0.95))
                max_price = int(modal_price * random.uniform(1.05, 1.15))
                
                # Arrivals based on market size and random daily fluctuation
                base_arrival = 100 * (market_size ** 2) if market_size >= 4 else 50 * market_size
                arrivals = int(base_arrival * random.uniform(0.5, 1.5))
                
                prices_list.append({
                    "market_id": market["id"],
                    "commodity_id": comm["id"],
                    "date": date_str,
                    "min_price": min_price,
                    "max_price": max_price,
                    "modal_price": modal_price,
                    "arrivals_tonnes": arrivals
                })

    # Save to files
    data_dir = os.path.dirname(os.path.abspath(__file__))
    
    with open(os.path.join(data_dir, "commodities.json"), "w") as f:
        json.dump(commodities_list, f, indent=2)
        
    with open(os.path.join(data_dir, "markets.json"), "w") as f:
        json.dump(markets_list, f, indent=2)
        
    with open(os.path.join(data_dir, "prices.json"), "w") as f:
        json.dump(prices_list, f, indent=2)
        
    print(f"Data generation complete.")
    print(f"Generated {len(commodities_list)} commodities.")
    print(f"Generated {len(markets_list)} markets.")
    print(f"Generated {len(prices_list)} price records.")
    print(f"Files saved in: {data_dir}")

if __name__ == "__main__":
    generate_data()
