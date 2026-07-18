import json
import re
import os

new_en = {
    "splash_tagline": "Rapido for Tractors & Farm Machines",
    "onboarding1_title": "Convenient Bookings",
    "onboarding1_desc": "Book tractors, JCBs & harvesters across 1000+ villages instantly in India.",
    "onboarding2_title": "Verified Operators",
    "onboarding2_desc": "Our skilled drivers & machinery captains follow verified safety & professional practices.",
    "onboarding3_title": "Pocket Friendly",
    "onboarding3_desc": "Flexible hourly and daily rental plans. We match the best machines for your budget.",
    "btn_skip": "Skip",
    "btn_get_started": "Getting Started",
    "login_brand_tagline": "Farm machinery at your fingertips",
    "login_role_title": "I am a...",
    "login_password_label": "Password",
    "login_remember_me": "Remember me",
    "login_forgot_password": "Forgot Password?",
    "login_or_continue": "Or continue with",
    "login_no_account": "Don't have an account?",
    "login_sign_up": "Sign Up",
    "header_search_placeholder": "Search tractors, tools...",
    "sidebar_help_title": "Need Help?",
    "sidebar_help_desc": "Contact our support for assistance.",
    "sidebar_help_btn": "Help",
    "dashboard_ongoing_rentals": "Ongoing Rentals",
    "dashboard_analytics_overview": "Analytics Overview",
    "dashboard_total_bookings": "Total Bookings",
    "dashboard_total_revenue": "Total Revenue",
    "dashboard_total_hours": "Total Hours Worked",
    "dashboard_total_acres": "Total Acres Worked",
    "dashboard_total_spent": "Total Spent",
    "dashboard_total_jobs": "Total Jobs",
    "chart_bookings_time": "Bookings Over Time",
    "chart_top_machines": "Top Machines",
    "chart_demand_heatmap": "Demand Heat Map (Village Level)",
    "chart_high_demand": "High Demand",
    "chart_low_demand": "Low Demand",
    "chart_machine_utilization": "Machine Utilization",
    "profile_role": "Registered Farmer Partner",
    "profile_id": "Farmer ID",
    "profile_phone": "Phone Number",
    "profile_hub": "Primary Hub",
    "profile_aadhaar": "Aadhaar Verified",
    "profile_yes": "Yes",
    "chart_usage_breakdown": "Usage Breakdown",
    "chart_monthly_spending": "Monthly Spending"
}

new_hi = {
    "splash_tagline": "ट्रैक्टर और कृषि मशीनों के लिए रैपिडो",
    "onboarding1_title": "सुविधाजनक बुकिंग",
    "onboarding1_desc": "भारत में 1000+ गांवों में ट्रैक्टर, जेसीबी और हार्वेस्टर तुरंत बुक करें।",
    "onboarding2_title": "सत्यापित ऑपरेटर",
    "onboarding2_desc": "हमारे कुशल ड्राइवर सुरक्षा और पेशेवर प्रथाओं का पालन करते हैं।",
    "onboarding3_title": "किफायती मूल्य",
    "onboarding3_desc": "लचीले घंटे और दैनिक किराये की योजनाएं।",
    "btn_skip": "छोड़ें",
    "btn_get_started": "शुरू करें",
    "login_brand_tagline": "कृषि मशीनरी आपकी उंगलियों पर",
    "login_role_title": "मैं एक...",
    "login_password_label": "पासवर्ड",
    "login_remember_me": "मुझे याद रखें",
    "login_forgot_password": "पासवर्ड भूल गए?",
    "login_or_continue": "या इसके साथ जारी रखें",
    "login_no_account": "क्या आपके पास खाता नहीं है?",
    "login_sign_up": "साइन अप करें",
    "header_search_placeholder": "ट्रैक्टर, उपकरण खोजें...",
    "sidebar_help_title": "मदद चाहिए?",
    "sidebar_help_desc": "सहायता के लिए हमारे समर्थन से संपर्क करें।",
    "sidebar_help_btn": "मदद",
    "dashboard_ongoing_rentals": "चल रहे किराये",
    "dashboard_analytics_overview": "एनालिटिक्स अवलोकन",
    "dashboard_total_bookings": "कुल बुकिंग",
    "dashboard_total_revenue": "कुल राजस्व",
    "dashboard_total_hours": "कुल काम के घंटे",
    "dashboard_total_acres": "कुल एकड़ में काम",
    "dashboard_total_spent": "कुल खर्च",
    "dashboard_total_jobs": "कुल नौकरियां",
    "chart_bookings_time": "समय के साथ बुकिंग",
    "chart_top_machines": "शीर्ष मशीनें",
    "chart_demand_heatmap": "मांग हीट मैप (गांव स्तर)",
    "chart_high_demand": "उच्च मांग",
    "chart_low_demand": "कम मांग",
    "chart_machine_utilization": "मशीन उपयोग",
    "profile_role": "पंजीकृत किसान भागीदार",
    "profile_id": "किसान आईडी",
    "profile_phone": "फ़ोन नंबर",
    "profile_hub": "प्राथमिक हब",
    "profile_aadhaar": "आधार सत्यापित",
    "profile_yes": "हां",
    "chart_usage_breakdown": "उपयोग विवरण",
    "chart_monthly_spending": "मासिक खर्च"
}

new_ta = {
    "splash_tagline": "டிராக்டர்கள் மற்றும் விவசாய இயந்திரங்களுக்கான ரேபிடோ",
    "onboarding1_title": "வசதியான முன்பதிவுகள்",
    "onboarding1_desc": "இந்தியாவில் 1000+ கிராமங்களில் டிராக்டர்கள், ஜேசிபிகள் மற்றும் அறுவடை இயந்திரங்களை உடனடியாக முன்பதிவு செய்யுங்கள்.",
    "onboarding2_title": "சரிபார்க்கப்பட்ட ஆபரேட்டர்கள்",
    "onboarding2_desc": "எங்கள் திறமையான ஓட்டுநர்கள் பாதுகாப்பு மற்றும் தொழில்முறை நடைமுறைகளை பின்பற்றுகிறார்கள்.",
    "onboarding3_title": "பட்ஜெட்டுக்கு ஏற்றது",
    "onboarding3_desc": "நெகிழ்வான மணிநேர மற்றும் தினசரி வாடகை திட்டங்கள்.",
    "btn_skip": "தவிர்",
    "btn_get_started": "தொடங்கு",
    "login_brand_tagline": "உங்கள் விரல் நுனியில் விவசாய இயந்திரங்கள்",
    "login_role_title": "நான் ஒரு...",
    "login_password_label": "கடவுச்சொல்",
    "login_remember_me": "என்னை நினைவில் கொள்",
    "login_forgot_password": "கடவுச்சொல் மறந்துவிட்டதா?",
    "login_or_continue": "அல்லது தொடரவும்",
    "login_no_account": "கணக்கு இல்லையா?",
    "login_sign_up": "பதிவு செய்",
    "header_search_placeholder": "டிராக்டர்கள், கருவிகளைத் தேடுங்கள்...",
    "sidebar_help_title": "உதவி தேவையா?",
    "sidebar_help_desc": "உதவிக்கு எங்கள் ஆதரவை தொடர்பு கொள்ளவும்.",
    "sidebar_help_btn": "உதவி",
    "dashboard_ongoing_rentals": "தொடரும் வாடகைகள்",
    "dashboard_analytics_overview": "பகுப்பாய்வு கண்ணோட்டம்",
    "dashboard_total_bookings": "மொத்த முன்பதிவுகள்",
    "dashboard_total_revenue": "மொத்த வருவாய்",
    "dashboard_total_hours": "மொத்த வேலை நேரங்கள்",
    "dashboard_total_acres": "மொத்த ஏக்கர் வேலை",
    "dashboard_total_spent": "மொத்த செலவு",
    "dashboard_total_jobs": "மொத்த வேலைகள்",
    "chart_bookings_time": "காலப்போக்கில் முன்பதிவுகள்",
    "chart_top_machines": "சிறந்த இயந்திரங்கள்",
    "chart_demand_heatmap": "தேவை வரைபடம் (கிராம அளவில்)",
    "chart_high_demand": "அதிக தேவை",
    "chart_low_demand": "குறைந்த தேவை",
    "chart_machine_utilization": "இயந்திர பயன்பாடு",
    "profile_role": "பதிவு செய்யப்பட்ட விவசாயி கூட்டாளர்",
    "profile_id": "விவசாயி ஐடி",
    "profile_phone": "தொலைபேசி எண்",
    "profile_hub": "முதன்மை மையம்",
    "profile_aadhaar": "ஆதார் சரிபார்க்கப்பட்டது",
    "profile_yes": "ஆம்",
    "chart_usage_breakdown": "பயன்பாட்டு முறிவு",
    "chart_monthly_spending": "மாதாந்திர செலவு"
}

with open("d:\\agriride 1\\i18n.js", "r", encoding="utf-8") as f:
    content = f.read()

# Very hacky way to inject the new keys into TRANSLATIONS inside i18n.js
# We'll just replace the closing brace of each language with the new keys.

def inject_dict(content, lang_code, new_dict):
    dict_str = json.dumps(new_dict, ensure_ascii=False)[1:-1] # Remove { and }
    # Find `lang_code: { ... }` and insert before the closing brace
    # regex to find end of lang_code object
    pattern = r'("' + lang_code + r'"|' + lang_code + r'):\s*\{([^{}]*)\}'
    
    def replacer(match):
        prefix = match.group(1)
        inner = match.group(2).rstrip()
        if inner and not inner.endswith(','):
            inner += ','
        return f'{prefix}: {{\n{inner}\n{dict_str}\n}}'
        
    return re.sub(pattern, replacer, content)

content = inject_dict(content, 'en', new_en)
content = inject_dict(content, 'hi', new_hi)
content = inject_dict(content, 'ta', new_ta)

with open("d:\\agriride 1\\i18n.js", "w", encoding="utf-8") as f:
    f.write(content)

print("i18n.js updated successfully.")
