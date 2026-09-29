export interface LocationOption {
  name: string;
  state: string;
  lat: number;
  lon: number;
  radarStation: string;
  tier?: 1 | 2 | 3;
}

export const ALL_INDIAN_LOCATIONS: LocationOption[] = [
  // --- TELANGANA ---
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867, radarStation: 'DWR Hyderabad (Begumpet)', tier: 1 },
  { name: 'Warangal', state: 'Telangana', lat: 17.9689, lon: 79.5941, radarStation: 'DWR Hyderabad Radar Network', tier: 2 },
  { name: 'Karimnagar', state: 'Telangana', lat: 18.4386, lon: 79.1288, radarStation: 'DWR North Telangana', tier: 2 },
  { name: 'Nizamabad', state: 'Telangana', lat: 18.6725, lon: 78.0941, radarStation: 'DWR North Telangana', tier: 3 },
  { name: 'Khammam', state: 'Telangana', lat: 17.2473, lon: 80.1514, radarStation: 'DWR East Telangana', tier: 3 },

  // --- ANDHRA PRADESH ---
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185, radarStation: 'DWR Visakhapatnam (Kailasagiri)', tier: 1 },
  { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.6480, radarStation: 'DWR Machilipatnam / Vijayawada', tier: 2 },
  { name: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lon: 79.4192, radarStation: 'DWR Sriharikota / Tirupati', tier: 1 },
  { name: 'Kurnool', state: 'Andhra Pradesh', lat: 15.8281, lon: 78.0373, radarStation: 'DWR Rayalaseema', tier: 3 },
  { name: 'Rajahmundry', state: 'Andhra Pradesh', lat: 17.0005, lon: 81.8040, radarStation: 'DWR Godavari Basin', tier: 3 },

  // --- TAMIL NADU ---
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, radarStation: 'DWR Chennai (Port)', tier: 1 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558, radarStation: 'DWR Coimbatore (Kongu)', tier: 2 },
  { name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198, radarStation: 'DWR Madurai (South TN)', tier: 2 },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu', lat: 10.7905, lon: 78.7047, radarStation: 'DWR Trichy', tier: 3 },
  { name: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lon: 78.1460, radarStation: 'DWR Salem', tier: 3 },

  // --- KARNATAKA ---
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946, radarStation: 'DWR Bengaluru (GKVK)', tier: 1 },
  { name: 'Mangaluru', state: 'Karnataka', lat: 12.9141, lon: 74.8560, radarStation: 'DWR Mangaluru (Coastal)', tier: 2 },
  { name: 'Mysuru', state: 'Karnataka', lat: 12.2958, lon: 76.6394, radarStation: 'DWR South Karnataka', tier: 2 },
  { name: 'Hubballi-Dharwad', state: 'Karnataka', lat: 15.3647, lon: 75.1240, radarStation: 'DWR North Karnataka', tier: 3 },
  { name: 'Belagavi', state: 'Karnataka', lat: 15.8497, lon: 74.4977, radarStation: 'DWR Belagavi', tier: 3 },

  // --- MAHARASHTRA ---
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777, radarStation: 'DWR Mumbai (Colaba & Veravali)', tier: 1 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, radarStation: 'DWR Pune (Pashan / IMD)', tier: 1 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882, radarStation: 'DWR Nagpur (Sonegaon)', tier: 1 },
  { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lon: 73.7898, radarStation: 'DWR North Maharashtra', tier: 2 },
  { name: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', lat: 19.8762, lon: 75.3433, radarStation: 'DWR Marathwada', tier: 3 },
  { name: 'Solapur', state: 'Maharashtra', lat: 17.6599, lon: 75.9064, radarStation: 'DWR Solapur', tier: 3 },

  // --- GUJARAT ---
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714, radarStation: 'DWR Ahmedabad', tier: 1 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lon: 72.8311, radarStation: 'DWR South Gujarat', tier: 2 },
  { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lon: 73.1812, radarStation: 'DWR Central Gujarat', tier: 2 },
  { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lon: 70.8022, radarStation: 'DWR Saurashtra', tier: 3 },
  { name: 'Bhuj', state: 'Gujarat', lat: 23.2420, lon: 69.6669, radarStation: 'DWR Kutch (Bhuj)', tier: 3 },

  // --- DELHI NCR & NORTH ---
  { name: 'Delhi NCR', state: 'Delhi', lat: 28.6139, lon: 77.2090, radarStation: 'DWR Delhi (Palam & Mausam Bhawan)', tier: 1 },
  { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lon: 77.3910, radarStation: 'DWR Delhi East NCR', tier: 2 },
  { name: 'Gurugram', state: 'Haryana', lat: 28.4595, lon: 77.0266, radarStation: 'DWR Delhi South NCR', tier: 2 },

  // --- UTTAR PRADESH ---
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, radarStation: 'DWR Lucknow (Amausi)', tier: 1 },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739, radarStation: 'DWR Varanasi (Babatpur)', tier: 2 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319, radarStation: 'DWR Central UP', tier: 2 },
  { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081, radarStation: 'DWR West UP', tier: 3 },
  { name: 'Prayagraj', state: 'Uttar Pradesh', lat: 25.4358, lon: 81.8463, radarStation: 'DWR Prayagraj', tier: 3 },

  // --- RAJASTHAN ---
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, radarStation: 'DWR Jaipur (Sanganer)', tier: 1 },
  { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lon: 73.0243, radarStation: 'DWR Jodhpur (Marwar)', tier: 2 },
  { name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lon: 73.7125, radarStation: 'DWR Mewar', tier: 3 },
  { name: 'Kota', state: 'Rajasthan', lat: 25.2138, lon: 75.8648, radarStation: 'DWR Hadoti', tier: 3 },

  // --- MADHYA PRADESH ---
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126, radarStation: 'DWR Bhopal (Bairagarh)', tier: 1 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577, radarStation: 'DWR Indore (Malwa)', tier: 2 },
  { name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lon: 79.9864, radarStation: 'DWR Mahakoshal', tier: 3 },
  { name: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lon: 78.1828, radarStation: 'DWR Chambal', tier: 3 },

  // --- WEST BENGAL ---
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, radarStation: 'DWR Kolkata (Alipore & New Town)', tier: 1 },
  { name: 'Siliguri', state: 'West Bengal', lat: 26.7271, lon: 88.3953, radarStation: 'DWR North Bengal', tier: 2 },
  { name: 'Asansol', state: 'West Bengal', lat: 23.6739, lon: 86.9524, radarStation: 'DWR West Bengal West', tier: 3 },

  // --- ODISHA ---
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lon: 85.8245, radarStation: 'DWR Paradip / BBSR', tier: 1 },
  { name: 'Puri', state: 'Odisha', lat: 19.8135, lon: 85.8312, radarStation: 'DWR Coastal Odisha', tier: 2 },
  { name: 'Rourkela', state: 'Odisha', lat: 22.2604, lon: 84.8536, radarStation: 'DWR North Odisha', tier: 3 },

  // --- BIHAR & JHARKHAND ---
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376, radarStation: 'DWR Patna (Jay Prakash)', tier: 1 },
  { name: 'Gaya', state: 'Bihar', lat: 24.7914, lon: 85.0002, radarStation: 'DWR South Bihar', tier: 3 },
  { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lon: 85.3096, radarStation: 'DWR Ranchi (Birsa Munda)', tier: 1 },
  { name: 'Jamshedpur', state: 'Jharkhand', lat: 22.8046, lon: 86.2029, radarStation: 'DWR Singhbhum', tier: 2 },

  // --- KERALA ---
  { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lon: 76.9366, radarStation: 'DWR Thiruvananthapuram', tier: 1 },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673, radarStation: 'DWR Kochi (INS Garuda)', tier: 1 },
  { name: 'Kozhikode', state: 'Kerala', lat: 11.2588, lon: 75.7804, radarStation: 'DWR Malabar', tier: 2 },

  // --- PUNJAB, HARYANA & CHANDIGARH ---
  { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lon: 76.7794, radarStation: 'DWR Chandigarh / Mohali', tier: 1 },
  { name: 'Amritsar', state: 'Punjab', lat: 31.6340, lon: 74.8723, radarStation: 'DWR Amritsar (Rajasansi)', tier: 2 },
  { name: 'Ludhiana', state: 'Punjab', lat: 30.9010, lon: 75.8573, radarStation: 'DWR Central Punjab', tier: 3 },

  // --- JAMMU & KASHMIR, LADAKH, HIMACHAL, UTTARAKHAND ---
  { name: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lon: 74.7973, radarStation: 'DWR Srinagar (Kashmir Valley)', tier: 1 },
  { name: 'Jammu', state: 'Jammu and Kashmir', lat: 32.7266, lon: 74.8570, radarStation: 'DWR Jammu', tier: 2 },
  { name: 'Leh', state: 'Ladakh', lat: 34.1526, lon: 77.5771, radarStation: 'DWR Ladakh High Altitude', tier: 2 },
  { name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lon: 77.1734, radarStation: 'DWR Shimla (Kufri)', tier: 1 },
  { name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lon: 78.0322, radarStation: 'DWR Dehradun (Surkanda Devi)', tier: 1 },

  // --- NORTHEAST INDIA ---
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lon: 91.7362, radarStation: 'DWR Guwahati (Borjhar)', tier: 1 },
  { name: 'Shillong', state: 'Meghalaya', lat: 25.5788, lon: 91.8933, radarStation: 'DWR Shillong (Sohra Plateau)', tier: 1 },
  { name: 'Agartala', state: 'Tripura', lat: 23.8315, lon: 91.2868, radarStation: 'DWR Agartala', tier: 1 },
  { name: 'Imphal', state: 'Manipur', lat: 24.8170, lon: 93.9368, radarStation: 'DWR Imphal', tier: 2 },
  { name: 'Aizawl', state: 'Mizoram', lat: 23.7271, lon: 92.7176, radarStation: 'DWR Aizawl', tier: 2 },
  { name: 'Kohima', state: 'Nagaland', lat: 25.6751, lon: 94.1086, radarStation: 'DWR Kohima', tier: 2 },
  { name: 'Gangtok', state: 'Sikkim', lat: 27.3389, lon: 88.6065, radarStation: 'DWR Sikkim (Gangtok)', tier: 2 },
  { name: 'Itanagar', state: 'Arunachal Pradesh', lat: 27.0844, lon: 93.6053, radarStation: 'DWR Arunachal', tier: 2 },

  // --- CHHATTISGARH & GOA ---
  { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lon: 81.6296, radarStation: 'DWR Raipur', tier: 1 },
  { name: 'Panaji', state: 'Goa', lat: 15.4909, lon: 73.8278, radarStation: 'DWR Goa (Panaji)', tier: 1 },

  // --- ISLANDS ---
  { name: 'Port Blair', state: 'Andaman & Nicobar', lat: 11.6234, lon: 92.7265, radarStation: 'DWR Port Blair (Bay Islands)', tier: 1 }
];

export const MAJOR_RADAR_CITIES = ALL_INDIAN_LOCATIONS;
