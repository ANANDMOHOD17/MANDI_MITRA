import os
import json
import time
import requests
from datetime import datetime

CACHE_FILE = os.path.join(os.path.dirname(__file__), 'live_cache.json')
CACHE_TTL = 3600  # 1 hour
API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
DEFAULT_API_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"

LAST_REFRESH_ATTEMPT = 0
RETRY_BACKOFF = 300  # 5 minutes backoff if network fails

def get_api_key():
    return os.environ.get('DATA_GOV_API_KEY', DEFAULT_API_KEY)

def _load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return None
    # Self-healing: if cache file doesn't exist, generate bootstrap cache
    try:
        from data.seed_live_data import generate_pan_india_live_data
        generate_pan_india_live_data()
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Bootstrap cache generation note: {e}")
    return None

def _save_cache(data):
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump({
                'timestamp': time.time(),
                'data': data
            }, f, indent=2)
    except Exception:
        pass

def fetch_live_data_raw(limit=1000, offset=0, api_key=None):
    key = api_key or get_api_key()
    params = {
        'api-key': key,
        'format': 'json',
        'limit': limit,
        'offset': offset
    }
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    response = requests.get(API_URL, params=params, headers=headers, timeout=4)
    response.raise_for_status()
    return response.json()

def refresh_cache(api_key=None):
    global LAST_REFRESH_ATTEMPT
    LAST_REFRESH_ATTEMPT = time.time()
    try:
        all_records = []
        
        # First request to get total and first batch
        data = fetch_live_data_raw(limit=1000, offset=0, api_key=api_key)
        records = data.get('records', [])
        all_records.extend(records)
        
        total = data.get('total', 0)
        
        # If there are more, fetch second batch
        if total > 1000:
            data2 = fetch_live_data_raw(limit=1000, offset=1000, api_key=api_key)
            all_records.extend(data2.get('records', []))
            
        if all_records:
            _save_cache(all_records)
            return True
        return False
    except Exception as e:
        print(f"Live API refresh note (using local cache): {e}")
        return False

def get_live_data():
    global LAST_REFRESH_ATTEMPT
    cache = _load_cache()
    current_time = time.time()
    
    source = 'cache'
    
    # Only try network refresh if cache is expired and we haven't tried recently
    if not cache or ((current_time - cache.get('timestamp', 0)) > CACHE_TTL and (current_time - LAST_REFRESH_ATTEMPT) > RETRY_BACKOFF):
        success = refresh_cache()
        if success:
            cache = _load_cache()
            source = 'live'
        else:
            source = 'fallback' if cache else 'unavailable'
            
    if source == 'unavailable' or not cache:
        return {'records': [], 'last_updated': None, 'source': 'unavailable', 'total': 0}
        
    return {
        'records': cache.get('data', []),
        'last_updated': cache.get('timestamp', 0),
        'source': source,
        'total': len(cache.get('data', []))
    }

def format_date(date_str):
    if not date_str:
        return date_str
    try:
        dt = datetime.strptime(date_str, '%d/%m/%Y')
        return dt.strftime('%Y-%m-%d')
    except Exception:
        return date_str

def process_records(records):
    processed = []
    for r in records:
        try:
            min_price = float(r.get('min_price', 0) or 0)
            max_price = float(r.get('max_price', 0) or 0)
            modal_price = float(r.get('modal_price', 0) or 0)
        except ValueError:
            min_price = max_price = modal_price = 0
            
        processed.append({
            'state': r.get('state', ''),
            'district': r.get('district', ''),
            'market': r.get('market', ''),
            'commodity': r.get('commodity', ''),
            'variety': r.get('variety', ''),
            'grade': r.get('grade', ''),
            'arrival_date': format_date(r.get('arrival_date', '')),
            'min_price': min_price,
            'max_price': max_price,
            'modal_price': modal_price
        })
    return processed

def fetch_live_prices(state=None, district=None, commodity=None, limit=100, page=1):
    data = get_live_data()
    records = data.get('records', [])
    
    filtered = []
    for r in records:
        if state and r.get('state', '').lower() != state.lower():
            continue
        if district and r.get('district', '').lower() != district.lower():
            continue
        if commodity and r.get('commodity', '').lower() != commodity.lower():
            continue
        filtered.append(r)
        
    processed_filtered = process_records(filtered)
    
    # Sort by arrival date desc
    processed_filtered.sort(key=lambda x: x['arrival_date'], reverse=True)
    
    total = len(processed_filtered)
    start = (page - 1) * limit
    end = start + limit
    
    paginated = processed_filtered[start:end]
    
    return {
        'records': paginated,
        'total': total,
        'last_updated': data['last_updated'],
        'source': data['source']
    }

def get_all_states():
    data = get_live_data()
    states = set(r.get('state') for r in data.get('records', []) if r.get('state'))
    return sorted(list(states))

def get_districts(state):
    if not state:
        return []
    data = get_live_data()
    districts = set(r.get('district') for r in data.get('records', []) if r.get('state', '').lower() == state.lower() and r.get('district'))
    return sorted(list(districts))

def get_commodities_list():
    data = get_live_data()
    commodities = set(r.get('commodity') for r in data.get('records', []) if r.get('commodity'))
    return sorted(list(commodities))
