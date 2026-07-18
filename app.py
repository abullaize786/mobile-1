# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify, send_from_directory
import os
import json
import time

app = Flask(__name__, static_folder='.', static_url_path='')

DB_FILE = 'db.json'

def load_db():
    default_data = {
        "bookings": [], 
        "alerts": [],
        "users": [
            {
                "phone": "9876543210",
                "password": "farmer123",
                "name": "Palaniswamy K.",
                "role": "farmer"
            },
            {
                "phone": "8765432109",
                "password": "worker123",
                "name": "Ramesh Kumar",
                "role": "worker"
            }
        ]
    }
    if not os.path.exists(DB_FILE):
        save_db(default_data)
        return default_data
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            db = json.load(f)
            if 'users' not in db:
                db['users'] = default_data['users']
                save_db(db)
            return db
    except Exception:
        return default_data

def save_db(data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# Serve Web Pages
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/login.html')
def login():
    return send_from_directory('.', 'login.html')

@app.route('/booking.html')
def booking():
    return send_from_directory('.', 'booking.html')

# API Endpoints
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json or {}
    phone = data.get('phone')
    role = data.get('role')
    password = data.get('password')
    
    if not phone or not role or not password:
        return jsonify({"error": "Phone, role and password are required"}), 400
        
    db = load_db()
    users = db.get('users', [])
    
    # Try to find matching user
    user_found = None
    for u in users:
        if u['phone'] == phone:
            user_found = u
            break
            
    if user_found:
        if user_found['password'] != password:
            return jsonify({"error": "Incorrect password"}), 401
        if user_found['role'] != role:
            return jsonify({"error": f"This number is registered as a {user_found['role']}. Please select the correct role."}), 403
            
        return jsonify({
            "success": True, 
            "phone": user_found['phone'], 
            "role": user_found['role'],
            "name": user_found['name']
        })
    else:
        # Register new user dynamically
        new_name = f"Farmer Partner {phone[-4:]}" if role == 'farmer' else f"Worker Captain {phone[-4:]}"
        new_user = {
            "phone": phone,
            "password": password,
            "name": new_name,
            "role": role
        }
        users.append(new_user)
        db['users'] = users
        save_db(db)
        
        return jsonify({
            "success": True,
            "phone": phone,
            "role": role,
            "name": new_name,
            "isNew": True
        })

@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    db = load_db()
    return jsonify(db.get('bookings', []))

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    db = load_db()
    booking = request.json or {}
    if not booking.get('id'):
        booking['id'] = f"AR-{int(time.time() * 1000)}"
    
    db['bookings'].append(booking)
    
    # Add new booking alert
    alerts = db.get('alerts', [])
    alerts.insert(0, {
        "id": int(time.time() * 1000),
        "title": "New Booking Confirmed ✅",
        "message": f"Your {booking.get('machineName')} booking ({booking.get('id')}) has been confirmed for {booking.get('date')}.",
        "time": "Just now",
        "unread": True
    })
    db['alerts'] = alerts
    
    save_db(db)
    return jsonify({"success": True, "booking": booking})

@app.route('/api/bookings/<booking_id>/status', methods=['PUT'])
def update_booking_status(booking_id):
    db = load_db()
    status_data = request.json or {}
    new_status = status_data.get('status')
    
    if not new_status:
        return jsonify({"error": "Status is required"}), 400
        
    booking_found = None
    for b in db['bookings']:
        if b['id'] == booking_id:
            b['status'] = new_status
            booking_found = b
            break
            
    if not booking_found:
        return jsonify({"error": "Booking not found"}), 404
        
    alerts = db.get('alerts', [])
    title = 'Job Update 🚜'
    message = f"Job {booking_found.get('machineName')} ({booking_id}) status changed to {new_status}."
    
    if new_status == 'accepted':
        title = 'Job Accepted 🔧'
        message = f"Worker accepted your {booking_found.get('machineName')} job ({booking_id})."
    elif new_status == 'ongoing':
        title = 'Work Started ⚡'
        message = f"Worker started operating your booked {booking_found.get('machineName')} ({booking_id})."
    elif new_status == 'completed':
        title = 'Job Completed 🎉'
        message = f"Your booked {booking_found.get('machineName')} ({booking_id}) has been successfully operated."
    elif new_status == 'cancelled':
        title = 'Job Declined ❌'
        message = f"Worker declined your {booking_found.get('machineName')} booking ({booking_id})."
        
    alerts.insert(0, {
        "id": int(time.time() * 1000),
        "title": title,
        "message": message,
        "time": "Just now",
        "unread": True,
        "bookingId": booking_id
    })
    db['alerts'] = alerts
    
    save_db(db)
    return jsonify({"success": True, "booking": booking_found})

@app.route('/api/bookings/<booking_id>/cancel', methods=['POST'])
def cancel_booking(booking_id):
    db = load_db()
    data = request.json or {}
    reason = data.get('reason', 'Other')
    notes = data.get('notes', '')
    
    booking_found = None
    for b in db['bookings']:
        if b['id'] == booking_id:
            b['status'] = 'cancelled'
            b['cancelReason'] = reason
            b['cancelNotes'] = notes
            booking_found = b
            break
            
    if not booking_found:
        return jsonify({"error": "Booking not found"}), 404
        
    alerts = db.get('alerts', [])
    alerts.insert(0, {
        "id": int(time.time() * 1000),
        "title": "Booking Cancelled ❌",
        "message": f"Your {booking_found.get('machineName')} booking ({booking_id}) has been cancelled.",
        "time": "Just now",
        "unread": True
    })
    db['alerts'] = alerts
    
    save_db(db)
    return jsonify({"success": True, "booking": booking_found})

@app.route('/api/bookings/<booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    db = load_db()
    bookings = db.get('bookings', [])
    db['bookings'] = [b for b in bookings if b['id'] != booking_id]
    save_db(db)
    return jsonify({"success": True})

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    db = load_db()
    return jsonify(db.get('alerts', []))

@app.route('/api/alerts/<int:alert_id>/read', methods=['PUT'])
def mark_alert_read(alert_id):
    db = load_db()
    alert_found = False
    for a in db.get('alerts', []):
        if a['id'] == alert_id:
            a['unread'] = False
            alert_found = True
            break
    if not alert_found:
        return jsonify({"error": "Alert not found"}), 404
    save_db(db)
    return jsonify({"success": True})

@app.route('/api/alerts/<int:alert_id>', methods=['DELETE'])
def delete_alert(alert_id):
    db = load_db()
    alerts = db.get('alerts', [])
    db['alerts'] = [a for a in alerts if a['id'] != alert_id]
    save_db(db)
    return jsonify({"success": True})

@app.route('/api/clear', methods=['POST'])
def clear_test_data():
    save_db({
        "bookings": [],
        "alerts": [
            {
                "id": 1,
                "title": "Feedback Requested",
                "message": "How was your booking AR-84729 for JCB? Share your feedback now.",
                "time": "2 days ago",
                "unread": False
            },
            {
                "id": 2,
                "title": "Discount Alert! 🚜",
                "message": "Get 10% off on your next Tractor booking using code FARM10.",
                "time": "3 days ago",
                "unread": True
            }
        ]
    })
    return jsonify({"success": True})

@app.route('/api/system-info', methods=['GET'])
def system_info():
    return jsonify({
        "status": "online",
        "appName": "AgriRide",
        "version": "v1.2.5",
        "tagline": "Rapido for Tractors & Farm Machines",
        "motd": "Connecting farms and machinery instantly."
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
