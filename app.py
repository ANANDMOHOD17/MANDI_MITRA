import os
import json
import math
import statistics
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import sys
from data.live_data import fetch_live_prices, get_all_states, get_districts, get_commodities_list, refresh_cache

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')

# Cache for data
db = {
    'commodities': [],
    'markets': [],
    'prices': []
}

def load_data():
    global db
    
    try:
        if os.path.exists(os.path.join(DATA_DIR, 'commodities.json')):
            with open(os.path.join(DATA_DIR, 'commodities.json'), 'r') as f:
                db['commodities'] = json.load(f)
        else:
            db['commodities'] = []
            
        if os.path.exists(os.path.join(DATA_DIR, 'markets.json')):
            with open(os.path.join(DATA_DIR, 'markets.json'), 'r') as f:
                db['markets'] = json.load(f)
        else:
            db['markets'] = []
            
        if os.path.exists(os.path.join(DATA_DIR, 'prices.json')):
            with open(os.path.join(DATA_DIR, 'prices.json'), 'r') as f:
                db['prices'] = json.load(f)
        else:
            db['prices'] = []
            
        # Index prices by (market_id, commodity_id) for O(1) lookups
        db['prices_by_mc'] = {}
        for p in db['prices']:
            key = (p.get('market_id'), p.get('commodity_id'))
            if key not in db['prices_by_mc']:
                db['prices_by_mc'][key] = []
            db['prices_by_mc'][key].append(p)
            
        # Sort each list by date descending once so calculate_trend is fast
        for key in db['prices_by_mc']:
            db['prices_by_mc'][key].sort(key=lambda x: x.get('date', ''), reverse=True)
            
    except Exception as e:
        print(f"Error loading data: {e}")

# Load data on startup
load_data()

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of the earth in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    d = R * c
    return d

def get_prices_for_market_commodity(market_id, commodity_id):
    return db.get('prices_by_mc', {}).get((market_id, commodity_id), [])

def calculate_trend(prices, days):
    if not prices:
        return 0.0
    
    # Sort prices by date descending
    sorted_prices = sorted(prices, key=lambda x: x.get('date', ''), reverse=True)
    if len(sorted_prices) < 2:
        return 0.0
        
    latest = sorted_prices[0]
    try:
        latest_date = datetime.strptime(latest.get('date'), '%Y-%m-%d')
        target_date = latest_date - timedelta(days=days)
        
        # Find price closest to target date
        old_price = None
        for p in sorted_prices[1:]:
            p_date = datetime.strptime(p.get('date'), '%Y-%m-%d')
            if p_date <= target_date:
                old_price = p
                break
                
        if not old_price:
            old_price = sorted_prices[-1] # Fallback to oldest if not enough days
            
        latest_val = latest.get('modal_price', 0)
        old_val = old_price.get('modal_price', 0)
        
        if old_val > 0:
            return ((latest_val - old_val) / old_val) * 100
        return 0.0
    except:
        return 0.0

def generate_explanation(rank, market_data):
    name = market_data.get('name', 'This market')
    net_return = market_data.get('net_return', 0)
    trend = market_data.get('trend_label', 'Stable')
    dist = market_data.get('distance_km', 0)
    
    if rank == 1:
        return f"{name} offers the highest net return of ₹{net_return:,.2f} due to favorable {trend.lower()} prices and optimal transport distance of {dist:.1f} km."
    elif rank <= 3:
        return f"{name} is a strong alternative with competitive prices and reasonable logistics costs."
    else:
        return f"{name} is ranked #{rank} due to a combination of distance and current market rates."


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/commodities', methods=['GET'])
def get_commodities():
    return jsonify(db['commodities'])

@app.route('/api/states', methods=['GET'])
def get_states():
    states = list(set([m.get('state') for m in db['markets'] if m.get('state')]))
    return jsonify(sorted(states))

@app.route('/api/markets', methods=['GET'])
def get_markets():
    state = request.args.get('state')
    commodity_id = request.args.get('commodity')
    
    result = []
    for m in db['markets']:
        if state and m.get('state') != state:
            continue
            
        market_data = m.copy()
        
        if commodity_id:
            prices = get_prices_for_market_commodity(m.get('id'), commodity_id)
            if prices:
                # Sort by date
                sorted_prices = sorted(prices, key=lambda x: x.get('date', ''), reverse=True)
                market_data['latest_price'] = sorted_prices[0]
            else:
                market_data['latest_price'] = None
                
        result.append(market_data)
        
    return jsonify(result)

@app.route('/api/ranking', methods=['POST'])
def get_ranking():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid request"}), 400
        
    commodity_id = data.get('commodity_id')
    farmer_lat = data.get('farmer_lat')
    farmer_lng = data.get('farmer_lng')
    quantity = data.get('quantity_quintals', 0)
    transport_rate = data.get('transport_rate_per_km_per_qtl', 0)
    custom_transport_cost = data.get('custom_transport_cost')
    
    if not all([commodity_id, farmer_lat is not None, farmer_lng is not None]):
        return jsonify({"error": "Missing required fields"}), 400
        
    # Get commodity info
    commodity = next((c for c in db['commodities'] if c.get('id') == commodity_id), None)
        
    ranked_markets = []
    
    for m in db['markets']:
        m_lat = m.get('lat')
        m_lng = m.get('lng')
        
        if m_lat is None or m_lng is None:
            continue
            
        prices = get_prices_for_market_commodity(m.get('id'), commodity_id)
        if not prices:
            continue
            
        sorted_prices = sorted(prices, key=lambda x: x.get('date', ''), reverse=True)
        latest_price_data = sorted_prices[0]
        latest_price = latest_price_data.get('modal_price', 0)
        
        if latest_price <= 0:
            continue
            
        dist = haversine(farmer_lat, farmer_lng, m_lat, m_lng)
        
        if custom_transport_cost is not None:
            transport_cost = custom_transport_cost
        else:
            transport_cost = dist * transport_rate * quantity
            
        gross_revenue = latest_price * quantity
        commission_rate = m.get('commission_rate', 2.0) / 100.0  # Convert percentage to decimal
        commission = gross_revenue * commission_rate
        net_return = gross_revenue - transport_cost - commission
        
        trend_7d = calculate_trend(prices, 7)
        trend_30d = calculate_trend(prices, 30)
        
        trend_label = 'Stable'
        if trend_7d > 2:
            trend_label = 'Rising'
        elif trend_7d < -2:
            trend_label = 'Falling'
            
        # Volatility over 30 days
        last_30d_prices = []
        try:
            latest_date = datetime.strptime(latest_price_data.get('date'), '%Y-%m-%d')
            target_date = latest_date - timedelta(days=30)
            for p in prices:
                if datetime.strptime(p.get('date'), '%Y-%m-%d') >= target_date:
                    last_30d_prices.append(p.get('modal_price', 0))
        except:
            last_30d_prices = [p.get('modal_price', 0) for p in prices[:30]]
            
        volatility = statistics.stdev(last_30d_prices) if len(last_30d_prices) > 1 else 0
        
        # Arrivals trend
        arrivals_trend = 'Stable'
        if len(sorted_prices) >= 2:
            arr1 = sorted_prices[0].get('arrivals_tonnes', 0)
            arr2 = sorted_prices[1].get('arrivals_tonnes', 0)
            if arr1 > arr2 * 1.1: arrivals_trend = 'Increasing'
            elif arr1 < arr2 * 0.9: arrivals_trend = 'Decreasing'
            
        ranked_markets.append({
            'id': m.get('id'),
            'name': m.get('name'),
            'state': m.get('state'),
            'district': m.get('district'),
            'lat': m_lat,
            'lng': m_lng,
            'latest_price': latest_price,
            'price_trend': trend_7d,
            'price_trend_30d': trend_30d,
            'distance_km': dist,
            'transport_cost': transport_cost,
            'commission': commission,
            'gross_revenue': gross_revenue,
            'net_return': net_return,
            'trend_label': trend_label,
            'volatility': volatility,
            'arrivals_trend': arrivals_trend
        })
        
    # Sort by net return desc
    ranked_markets.sort(key=lambda x: x['net_return'], reverse=True)
    
    # Add explanations
    for i, rm in enumerate(ranked_markets):
        rm['explanation'] = generate_explanation(i + 1, rm)
        
    return jsonify(ranked_markets)

@app.route('/api/trends', methods=['GET'])
def get_trends():
    market_id = request.args.get('market_id')
    commodity_id = request.args.get('commodity_id')
    days = int(request.args.get('days', 30))
    
    if not market_id or not commodity_id:
        return jsonify({"error": "market_id and commodity_id required"}), 400
        
    prices = get_prices_for_market_commodity(market_id, commodity_id)
    sorted_prices = sorted(prices, key=lambda x: x.get('date', ''), reverse=True)
    
    result = sorted_prices[:days]
    result.reverse() # chronological order for charting
    
    return jsonify(result)

@app.route('/api/market-detail/<market_id>', methods=['GET'])
def get_market_detail(market_id):
    market = next((m for m in db['markets'] if m.get('id') == market_id), None)
    if not market:
        return jsonify({"error": "Market not found"}), 404
        
    # Find all commodities traded here
    market_prices = [p for p in db['prices'] if p.get('market_id') == market_id]
    
    commodities_dict = {}
    for p in market_prices:
        cid = p.get('commodity_id')
        if cid not in commodities_dict or p.get('date', '') > commodities_dict[cid].get('date', ''):
            commodities_dict[cid] = p
            
    commodities_traded = []
    for cid, latest_price in commodities_dict.items():
        comm = next((c for c in db['commodities'] if c.get('id') == cid), {})
        commodities_traded.append({
            'commodity_id': cid,
            'commodity_name': comm.get('name', cid),
            'latest_price': latest_price.get('modal_price'),
            'date': latest_price.get('date')
        })
        
    detail = market.copy()
    detail['commodities_traded'] = commodities_traded
    return jsonify(detail)

@app.route('/api/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    total_markets = len(db['markets'])
    total_commodities = len(db['commodities'])
    
    highest_price_item = None
    max_price = 0
    
    for p in db['prices']:
        # simplistic approach, real app might filter by 'today'
        if p.get('modal_price', 0) > max_price:
            max_price = p.get('modal_price', 0)
            highest_price_item = p
            
    highest_commodity = {}
    if highest_price_item:
        cid = highest_price_item.get('commodity_id')
        mid = highest_price_item.get('market_id')
        cname = next((c.get('name') for c in db['commodities'] if c.get('id') == cid), cid)
        mname = next((m.get('name') for m in db['markets'] if m.get('id') == mid), mid)
        highest_commodity = {
            'commodity': cname,
            'market': mname,
            'price': max_price
        }
        
    # mock most volatile
    most_volatile = "Onion"
    
    # mock average prices by category
    avg_prices = {
        "Cereals": 2500,
        "Vegetables": 1800,
        "Fruits": 4500
    }
    
    return jsonify({
        'total_markets': total_markets,
        'total_commodities': total_commodities,
        'highest_price_today': highest_commodity,
        'most_volatile_commodity': most_volatile,
        'average_prices_by_category': avg_prices
    })

import io
import csv
from flask import Response

@app.route('/atlas')
def atlas_page():
    return render_template('atlas.html')

@app.route('/reports')
def reports_page():
    return render_template('reports.html')

@app.route('/market/<market_id>')
def market_redirect(market_id):
    from flask import redirect
    return redirect(f'/?market={market_id}')

def compute_atlas_markets():
    result = []
    market_prices = {}
    for p in db['prices']:
        mid = p['market_id']
        cid = p['commodity_id']
        if mid not in market_prices:
            market_prices[mid] = {}
        if cid not in market_prices[mid] or p['date'] > market_prices[mid][cid]['date']:
            market_prices[mid][cid] = p
            
    for m in db['markets']:
        mid = m['id']
        if mid not in market_prices:
            continue
            
        m_prices = list(market_prices[mid].values())
        commodities_count = len(m_prices)
        total_arrivals = sum(p.get('arrivals_tonnes', 0) for p in m_prices)
        avg_price = sum(p.get('modal_price', 0) for p in m_prices) / commodities_count if commodities_count > 0 else 0
        sorted_m_prices = sorted(m_prices, key=lambda x: x.get('modal_price', 0), reverse=True)
        top_5 = sorted_m_prices[:5]
        
        top_commodities = []
        for p in top_5:
            cname = next((c.get('name') for c in db['commodities'] if c.get('id') == p['commodity_id']), p['commodity_id'])
            p_history = get_prices_for_market_commodity(mid, p['commodity_id'])
            trend_7d = calculate_trend(p_history, 7)
            top_commodities.append({
                'commodity_id': p['commodity_id'],
                'commodity_name': cname,
                'modal_price': p.get('modal_price', 0),
                'trend_7d': trend_7d,
                'arrivals_tonnes': p.get('arrivals_tonnes', 0)
            })
            
        market_data = m.copy()
        market_data.update({
            'commodities_count': commodities_count,
            'top_commodities': top_commodities,
            'total_arrivals': total_arrivals,
            'avg_price': avg_price
        })
        result.append(market_data)
    return result

def compute_atlas_state_summary(commodity_id=None):
    if commodity_id:
        c_prices = [p for p in db['prices'] if p.get('commodity_id') == commodity_id]
    else:
        c_prices = db['prices']
        
    if not c_prices:
        return []
        
    latest_date = max(p['date'] for p in c_prices)
    latest_prices = [p for p in c_prices if p['date'] == latest_date]
    
    state_data = {}
    for p in latest_prices:
        mid = p['market_id']
        market = next((m for m in db['markets'] if m['id'] == mid), None)
        if not market: continue
        state = market.get('state')
        if not state: continue
        
        if state not in state_data:
            state_data[state] = {
                'prices': [],
                'markets': set(),
                'market_names': set()
            }
        state_data[state]['prices'].append(p)
        state_data[state]['markets'].add(mid)
        state_data[state]['market_names'].add(market.get('name'))
        
    result = []
    for state, data in state_data.items():
        prices = data['prices']
        total_arrivals = sum(p.get('arrivals_tonnes', 0) for p in prices)
        avg_modal = sum(p.get('modal_price', 0) for p in prices) / len(prices)
        min_price = min(p.get('min_price', p.get('modal_price', 0)) for p in prices)
        max_price = max(p.get('max_price', p.get('modal_price', 0)) for p in prices)
        
        top_c = max(prices, key=lambda x: x.get('modal_price', 0))
        cname = next((c.get('name') for c in db['commodities'] if c.get('id') == top_c['commodity_id']), top_c['commodity_id'])
        
        trend_sum = 0
        for p in prices:
            p_history = get_prices_for_market_commodity(p['market_id'], p['commodity_id'])
            trend_sum += calculate_trend(p_history, 7)
        trend_7d = trend_sum / len(prices) if len(prices) > 0 else 0
        
        result.append({
            'state': state,
            'mandi_count': len(data['markets']),
            'avg_modal_price': avg_modal,
            'min_price': min_price,
            'max_price': max_price,
            'total_arrivals': total_arrivals,
            'top_commodity': cname,
            'top_commodity_price': top_c.get('modal_price', 0),
            'trend_7d': trend_7d,
            'market_names': list(data['market_names'])
        })
    return result

# Initialize caches once data is loaded
db['states'] = sorted(list(set([m.get('state') for m in db['markets'] if m.get('state')])))
db['atlas_markets_cache'] = compute_atlas_markets()
db['atlas_state_summary_cache'] = compute_atlas_state_summary()

@app.route('/api/atlas/init')
def get_atlas_init():
    return jsonify({
        'commodities': db['commodities'],
        'states': db['states'],
        'markets': db.get('atlas_markets_cache', []),
        'state_summary': db.get('atlas_state_summary_cache', [])
    })

@app.route('/api/atlas/markets')
def get_atlas_markets():
    return jsonify(db.get('atlas_markets_cache', []))

@app.route('/api/atlas/heatmap')
def get_atlas_heatmap():
    commodity_id = request.args.get('commodity_id')
    if not commodity_id:
        return jsonify([])
        
    c_prices = [p for p in db['prices'] if p.get('commodity_id') == commodity_id]
    if not c_prices:
        return jsonify([])
        
    latest_date = max(p['date'] for p in c_prices)
    latest_prices = [p for p in c_prices if p['date'] == latest_date]
    
    if not latest_prices:
        return jsonify([])
        
    national_avg = sum(p.get('modal_price', 0) for p in latest_prices) / len(latest_prices)
    min_modal = min(p.get('modal_price', 0) for p in latest_prices)
    max_modal = max(p.get('modal_price', 0) for p in latest_prices)
    
    result = []
    for p in latest_prices:
        mid = p['market_id']
        market = next((m for m in db['markets'] if m['id'] == mid), None)
        if not market:
            continue
            
        modal_price = p.get('modal_price', 0)
        price_vs_avg_pct = ((modal_price - national_avg) / national_avg) * 100 if national_avg > 0 else 0
        
        if max_modal > min_modal:
            color_intensity = (modal_price - min_modal) / (max_modal - min_modal)
        else:
            color_intensity = 0.5
            
        p_history = get_prices_for_market_commodity(mid, commodity_id)
        trend_7d = calculate_trend(p_history, 7)
        
        trend_label = 'Stable'
        if trend_7d > 2: trend_label = 'Rising'
        elif trend_7d < -2: trend_label = 'Falling'
        
        result.append({
            'market_id': mid,
            'market_name': market.get('name'),
            'state': market.get('state'),
            'lat': market.get('lat'),
            'lng': market.get('lng'),
            'modal_price': modal_price,
            'min_price': p.get('min_price', 0),
            'max_price': p.get('max_price', 0),
            'national_avg': national_avg,
            'price_vs_avg_pct': price_vs_avg_pct,
            'trend_7d': trend_7d,
            'trend_label': trend_label,
            'arrivals_tonnes': p.get('arrivals_tonnes', 0),
            'color_intensity': color_intensity
        })
        
    return jsonify(result)

@app.route('/api/atlas/state-summary')
def get_atlas_state_summary():
    commodity_id = request.args.get('commodity_id')
    if not commodity_id:
        return jsonify(db.get('atlas_state_summary_cache', []))
    return jsonify(compute_atlas_state_summary(commodity_id))

@app.route('/api/atlas/commodity-summary')
def get_atlas_commodity_summary():
    commodity_id = request.args.get('commodity_id')
    if not commodity_id:
        return jsonify({"error": "commodity_id required"}), 400
        
    commodity = next((c for c in db['commodities'] if c['id'] == commodity_id), None)
    if not commodity:
        return jsonify({"error": "Commodity not found"}), 404
        
    c_prices = [p for p in db['prices'] if p.get('commodity_id') == commodity_id]
    if not c_prices:
        return jsonify({"error": "No price data"}), 404
        
    latest_date = max(p['date'] for p in c_prices)
    latest_prices = [p for p in c_prices if p['date'] == latest_date]
    
    if not latest_prices:
        return jsonify({"error": "No latest price data"}), 404
        
    national_avg = sum(p.get('modal_price', 0) for p in latest_prices) / len(latest_prices)
    
    msp = commodity.get('msp', 0)
    msp_delta = national_avg - msp if msp > 0 else 0
    msp_delta_pct = (msp_delta / msp * 100) if msp > 0 else 0
    
    highest_p = max(latest_prices, key=lambda x: x.get('modal_price', 0))
    lowest_p = min(latest_prices, key=lambda x: x.get('modal_price', 0))
    
    hm = next((m for m in db['markets'] if m['id'] == highest_p['market_id']), {})
    lm = next((m for m in db['markets'] if m['id'] == lowest_p['market_id']), {})
    
    highest_market = {"name": hm.get('name'), "state": hm.get('state'), "price": highest_p.get('modal_price', 0)}
    lowest_market = {"name": lm.get('name'), "state": lm.get('state'), "price": lowest_p.get('modal_price', 0)}
    
    price_range = highest_p.get('modal_price', 0) - lowest_p.get('modal_price', 0)
    total_arrivals = sum(p.get('arrivals_tonnes', 0) for p in latest_prices)
    total_markets_trading = len(set(p['market_id'] for p in latest_prices))
    
    trend_7d_sum = 0
    trend_30d_sum = 0
    market_stats = []
    
    state_averages_dict = {}
    
    for p in latest_prices:
        mid = p['market_id']
        m = next((m for m in db['markets'] if m['id'] == mid), {})
        state = m.get('state', 'Unknown')
        
        p_history = get_prices_for_market_commodity(mid, commodity_id)
        t7 = calculate_trend(p_history, 7)
        t30 = calculate_trend(p_history, 30)
        
        trend_7d_sum += t7
        trend_30d_sum += t30
        
        market_stats.append({
            'name': m.get('name'),
            'state': state,
            'price': p.get('modal_price', 0),
            'trend_7d': t7,
            'arrivals': p.get('arrivals_tonnes', 0)
        })
        
        if state not in state_averages_dict:
            state_averages_dict[state] = {'sum': 0, 'count': 0}
        state_averages_dict[state]['sum'] += p.get('modal_price', 0)
        state_averages_dict[state]['count'] += 1
        
    trend_7d = trend_7d_sum / len(latest_prices)
    trend_30d = trend_30d_sum / len(latest_prices)
    
    trend_label = 'Stable'
    if trend_7d > 2: trend_label = 'Rising'
    elif trend_7d < -2: trend_label = 'Falling'
    
    market_stats.sort(key=lambda x: x['price'], reverse=True)
    top_10_markets = market_stats[:10]
    
    state_averages = []
    for st, d in state_averages_dict.items():
        state_averages.append({
            'state': st,
            'avg_price': d['sum'] / d['count'],
            'mandi_count': d['count']
        })
        
    return jsonify({
        "commodity_id": commodity_id,
        "commodity_name": commodity.get('name'),
        "category": commodity.get('category'),
        "unit": commodity.get('unit'),
        "msp": msp,
        "national_avg_price": national_avg,
        "msp_delta": msp_delta,
        "msp_delta_pct": msp_delta_pct,
        "highest_market": highest_market,
        "lowest_market": lowest_market,
        "price_range": price_range,
        "total_markets_trading": total_markets_trading,
        "total_arrivals": total_arrivals,
        "trend_7d": trend_7d,
        "trend_30d": trend_30d,
        "trend_label": trend_label,
        "top_10_markets": top_10_markets,
        "state_averages": state_averages
    })

def _get_filtered_reports_data():
    date_filter = request.args.get('date')
    state_filter = request.args.get('state')
    commodity_filter = request.args.get('commodity_id')
    
    if not date_filter and db['prices']:
        date_filter = max(p['date'] for p in db['prices'])
        
    filtered = []
    for p in db['prices']:
        if date_filter and p['date'] != date_filter:
            continue
        if commodity_filter and p['commodity_id'] != commodity_filter:
            continue
            
        mid = p['market_id']
        cid = p['commodity_id']
        m = next((m for m in db['markets'] if m['id'] == mid), {})
        
        if state_filter and m.get('state') != state_filter:
            continue
            
        c = next((c for c in db['commodities'] if c['id'] == cid), {})
        
        p_history = get_prices_for_market_commodity(mid, cid)
        trend_7d = calculate_trend(p_history, 7)
        
        filtered.append({
            'date': p['date'],
            'state': m.get('state', ''),
            'district': m.get('district', ''),
            'market_name': m.get('name', ''),
            'market_id': mid,
            'commodity_name': c.get('name', ''),
            'commodity_id': cid,
            'category': c.get('category', ''),
            'min_price': p.get('min_price', 0),
            'max_price': p.get('max_price', 0),
            'modal_price': p.get('modal_price', 0),
            'arrivals_tonnes': p.get('arrivals_tonnes', 0),
            'trend_7d': trend_7d
        })
        
    filtered.sort(key=lambda x: (x['state'], x['market_name'], x['commodity_name']))
    return filtered

@app.route('/api/reports/daily')
def get_reports_daily():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    
    filtered = _get_filtered_reports_data()
    
    total = len(filtered)
    total_pages = math.ceil(total / per_page) if per_page > 0 else 0
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    
    paginated_data = filtered[start_idx:end_idx]
    
    available_dates = sorted(list(set(p['date'] for p in db['prices'])), reverse=True)
    available_states = sorted(list(set(m.get('state') for m in db['markets'] if m.get('state'))))
    available_commodities = sorted([{"id": c['id'], "name": c['name']} for c in db['commodities']], key=lambda x: x['name'])
    
    return jsonify({
        "data": paginated_data,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": total_pages
        },
        "filters": {
            "available_dates": available_dates,
            "available_states": available_states,
            "available_commodities": available_commodities
        }
    })

@app.route('/api/reports/download')
def get_reports_download():
    filtered = _get_filtered_reports_data()
    
    date_filter = request.args.get('date')
    if not date_filter and db['prices']:
        date_filter = max(p['date'] for p in db['prices'])
    if not date_filter:
        date_filter = "latest"
        
    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(["Date", "State", "District", "Market", "Commodity", "Category", "Min Price", "Max Price", "Modal Price", "Arrivals (Tonnes)"])
    
    for row in filtered:
        cw.writerow([
            row['date'],
            row['state'],
            row['district'],
            row['market_name'],
            row['commodity_name'],
            row['category'],
            row['min_price'],
            row['max_price'],
            row['modal_price'],
            row['arrivals_tonnes']
        ])
        
    output = si.getvalue()
    
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename=mandi_report_{date_filter}.csv"}
    )

@app.route('/live')
def live_page():
    return render_template('live.html')

@app.route('/api/live/prices')
def get_live_prices():
    state = request.args.get('state')
    district = request.args.get('district')
    commodity = request.args.get('commodity')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('per_page', 100))
    
    result = fetch_live_prices(state=state, district=district, commodity=commodity, limit=limit, page=page)
    return jsonify(result)

@app.route('/api/live/states')
def get_live_states():
    return jsonify(get_all_states())

@app.route('/api/live/districts')
def get_live_districts():
    state = request.args.get('state')
    return jsonify(get_districts(state))

@app.route('/api/live/commodities')
def get_live_commodities():
    return jsonify(get_commodities_list())

@app.route('/api/live/summary')
def get_live_summary():
    data = fetch_live_prices(limit=100000, page=1)  # Getting enough records for summary
    records = data.get('records', [])
    
    states_covered = len(set(r.get('state') for r in records if r.get('state')))
    
    highest_price_record = None
    lowest_price_record = None
    
    for r in records:
        price = r.get('modal_price', 0)
        if price > 0:
            if not highest_price_record or price > highest_price_record.get('modal_price', 0):
                highest_price_record = r
            if not lowest_price_record or price < lowest_price_record.get('modal_price', float('inf')):
                lowest_price_record = r
                
    highest = None
    if highest_price_record:
        highest = f"{highest_price_record.get('commodity')} (₹{highest_price_record.get('modal_price')})"
        
    lowest = None
    if lowest_price_record:
        lowest = f"{lowest_price_record.get('commodity')} (₹{lowest_price_record.get('modal_price')})"
        
    return jsonify({
        'total_records': data.get('total', 0),
        'states_covered': states_covered,
        'highest_priced': highest,
        'lowest_priced': lowest,
        'last_updated': data.get('last_updated'),
        'source': data.get('source')
    })

@app.route('/api/live/refresh', methods=['POST'])
def force_refresh_live_data():
    req_data = request.get_json(silent=True) or {}
    api_key = req_data.get('api_key') or request.args.get('api_key')
    success = refresh_cache(api_key=api_key)
    if success:
        return jsonify({'status': 'success', 'source': 'live'})
    return jsonify({'status': 'cached', 'source': 'cache', 'message': 'Loaded from verified local cache (data.gov.in unreachable or key invalid)'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
