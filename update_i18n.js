const fs = require('fs');

const newEn = {
    "booking_machine_type": "Machine Type",
    "booking_date": "Date",
    "booking_time": "Time",
    "booking_duration": "Duration",
    "booking_phone": "Phone Number",
    "booking_address": "Farm Address",
    "booking_operator_needed": "Operator Needed",
    "booking_include_operator": "Include Operator",
    "booking_operator_desc": "An experienced operator will be assigned",
    "booking_next": "Next",
    "booking_back": "Back",
    "booking_step2_title": "Booking Details",
    "booking_step2_sub": "Review and complete your booking information.",
    "booking_notes": "Notes (Optional)",
    "booking_location": "Location",
    "booking_show_route": "Show Route",
    "booking_step3_title": "Select Machine",
    "booking_step3_sub": "Choose a machine from the available options for your booking.",
    "booking_price_notice": "Prices may vary based on location and availability.",
    "booking_step4_title": "Review Booking",
    "booking_step4_sub": "Please review your booking details before confirming.",
    "booking_payment_method": "Payment Method",
    "payment_upi": "UPI Payment",
    "payment_upi_desc": "Google Pay, PhonePe, Paytm, BHIM",
    "payment_cod": "Cash on Delivery",
    "payment_cod_desc": "Pay when the machine arrives at your field",
    "payment_card": "Credit / Debit Card",
    "payment_card_desc": "Visa, Mastercard, Rupay",
    "payment_netbanking": "Net Banking",
    "payment_netbanking_desc": "All major Indian banks supported",
    "booking_secure_notice": "Your payment is secure and encrypted.",
    "booking_confirm": "Confirm Booking"
};

const newHi = {
    "booking_machine_type": "मशीन का प्रकार",
    "booking_date": "तारीख",
    "booking_time": "समय",
    "booking_duration": "अवधि",
    "booking_phone": "फ़ोन नंबर",
    "booking_address": "खेत का पता",
    "booking_operator_needed": "ऑपरेटर की आवश्यकता है",
    "booking_include_operator": "ऑपरेटर शामिल करें",
    "booking_operator_desc": "एक अनुभवी ऑपरेटर सौंपा जाएगा",
    "booking_next": "आगे",
    "booking_back": "पीछे",
    "booking_step2_title": "बुकिंग विवरण",
    "booking_step2_sub": "अपनी बुकिंग जानकारी की समीक्षा करें और पूरी करें।",
    "booking_notes": "नोट्स (वैकल्पिक)",
    "booking_location": "स्थान",
    "booking_show_route": "मार्ग दिखाएँ",
    "booking_step3_title": "मशीन चुनें",
    "booking_step3_sub": "अपनी बुकिंग के लिए उपलब्ध विकल्पों में से एक मशीन चुनें।",
    "booking_price_notice": "कीमतें स्थान और उपलब्धता के आधार पर भिन्न हो सकती हैं।",
    "booking_step4_title": "बुकिंग की समीक्षा करें",
    "booking_step4_sub": "पुष्टि करने से पहले कृपया अपने बुकिंग विवरण की समीक्षा करें।",
    "booking_payment_method": "भुगतान का तरीका",
    "payment_upi": "यूपीआई (UPI) भुगतान",
    "payment_upi_desc": "Google Pay, PhonePe, Paytm, BHIM",
    "payment_cod": "कैश ऑन डिलीवरी",
    "payment_cod_desc": "मशीन आपके खेत में आने पर भुगतान करें",
    "payment_card": "क्रेडिट / डेबिट कार्ड",
    "payment_card_desc": "Visa, Mastercard, Rupay",
    "payment_netbanking": "नेट बैंकिंग",
    "payment_netbanking_desc": "सभी प्रमुख भारतीय बैंक समर्थित हैं",
    "booking_secure_notice": "आपका भुगतान सुरक्षित और एन्क्रिप्टेड है।",
    "booking_confirm": "बुकिंग की पुष्टि करें"
};

const newTa = {
    "booking_machine_type": "இயந்திர வகை",
    "booking_date": "தேதி",
    "booking_time": "நேரம்",
    "booking_duration": "கால அளவு",
    "booking_phone": "தொலைபேசி எண்",
    "booking_address": "பண்ணை முகவரி",
    "booking_operator_needed": "ஆபரேட்டர் தேவையா",
    "booking_include_operator": "ஆபரேட்டரைச் சேர்",
    "booking_operator_desc": "ஒரு அனுபவமிக்க ஆபரேட்டர் நியமிக்கப்படுவார்",
    "booking_next": "அடுத்து",
    "booking_back": "பின்னே",
    "booking_step2_title": "முன்பதிவு விவரங்கள்",
    "booking_step2_sub": "உங்கள் முன்பதிவு தகவலை மதிப்பாய்வு செய்து முடிக்கவும்.",
    "booking_notes": "குறிப்புகள் (விருப்பப்படி)",
    "booking_location": "இடம்",
    "booking_show_route": "வழியைக் காட்டு",
    "booking_step3_title": "இயந்திரத்தைத் தேர்ந்தெடுக்கவும்",
    "booking_step3_sub": "கிடைக்கும் விருப்பங்களிலிருந்து ஒரு இயந்திரத்தைத் தேர்ந்தெடுக்கவும்.",
    "booking_price_notice": "இடம் மற்றும் இருப்பைப் பொறுத்து விலைகள் மாறுபடலாம்.",
    "booking_step4_title": "முன்பதிவை மதிப்பாய்வு செய்யவும்",
    "booking_step4_sub": "உறுதிப்படுத்துவதற்கு முன் உங்கள் முன்பதிவு விவரங்களை மதிப்பாய்வு செய்யவும்.",
    "booking_payment_method": "கட்டண முறை",
    "payment_upi": "யுபிஐ (UPI) கட்டணம்",
    "payment_upi_desc": "Google Pay, PhonePe, Paytm, BHIM",
    "payment_cod": "பணம் செலுத்தும் முறை (Cash on Delivery)",
    "payment_cod_desc": "உங்கள் வயலுக்கு இயந்திரம் வரும்போது பணம் செலுத்துங்கள்",
    "payment_card": "கிரெடிட் / டெபிட் கார்டு",
    "payment_card_desc": "Visa, Mastercard, Rupay",
    "payment_netbanking": "நெட் பேங்கிங்",
    "payment_netbanking_desc": "அனைத்து முக்கிய இந்திய வங்கிகளும் ஆதரிக்கப்படுகின்றன",
    "booking_secure_notice": "உங்கள் கட்டணம் பாதுகாப்பானது மற்றும் குறியாக்கம் செய்யப்பட்டது.",
    "booking_confirm": "முன்பதிவை உறுதிப்படுத்தவும்"
};

let content = fs.readFileSync('i18n.js', 'utf8');

function injectDict(content, langCode, newDict) {
    let dictStr = JSON.stringify(newDict, null, 4);
    dictStr = dictStr.substring(1, dictStr.length - 1).trim(); // remove { and }
    
    // Regex to find "langCode": { ... }
    const pattern = new RegExp(`("${langCode}"|${langCode}):\\s*\\{([^{}]*)\\}`, 'g');
    
    return content.replace(pattern, (match, prefix, inner) => {
        let cleanInner = inner.trimEnd();
        if (cleanInner && !cleanInner.endsWith(',')) {
            cleanInner += ',';
        }
        return `${prefix}: {\n${cleanInner}\n${dictStr}\n}`;
    });
}

content = injectDict(content, 'en', newEn);
content = injectDict(content, 'hi', newHi);
content = injectDict(content, 'ta', newTa);

fs.writeFileSync('i18n.js', content, 'utf8');
console.log('Successfully updated i18n.js with booking details');
