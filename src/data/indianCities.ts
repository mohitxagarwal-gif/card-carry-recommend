export const METRO_CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", 
  "Kolkata", "Pune", "Ahmedabad"
];

const ALL_CITIES = [
  "Ahmedabad", "Agra", "Ajmer", "Aligarh", "Allahabad", "Amravati", "Amritsar", 
  "Asansol", "Aurangabad", "Bareilly", "Belgaum", "Bengaluru", "Bhavnagar", 
  "Bhilai", "Bhopal", "Bhubaneswar", "Bikaner", "Bokaro", "Chandigarh", 
  "Chennai", "Coimbatore", "Cuttack", "Dehradun", "Delhi", "Dhanbad", 
  "Durgapur", "Erode", "Faridabad", "Firozabad", "Ghaziabad", "Gorakhpur", 
  "Gulbarga", "Guntur", "Gurgaon", "Guwahati", "Gwalior", "Hubli-Dharwad", 
  "Hyderabad", "Indore", "Jabalpur", "Jaipur", "Jalandhar", "Jammu", 
  "Jamnagar", "Jamshedpur", "Jodhpur", "Kalyan-Dombivali", "Kanpur", 
  "Kochi", "Kolhapur", "Kolkata", "Kota", "Kozhikode", "Lucknow", "Ludhiana", 
  "Madurai", "Malegaon", "Mangalore", "Meerut", "Moradabad", "Mumbai", 
  "Mysore", "Nagpur", "Nanded", "Nashik", "Navi Mumbai", "Nellore", "Noida", 
  "Patna", "Pimpri-Chinchwad", "Pune", "Raipur", "Rajkot", "Ranchi", 
  "Salem", "Sangli", "Shimla", "Siliguri", "Solapur", "Srinagar", "Surat", 
  "Thane", "Thiruvananthapuram", "Thrissur", "Tiruchirappalli", "Tiruppur", 
  "Ujjain", "Vadodara", "Varanasi", "Vasai-Virar", "Vijayawada", 
  "Visakhapatnam", "Warangal"
];

export const OTHER_CITIES = ALL_CITIES
  .filter(city => !METRO_CITIES.includes(city))
  .sort();

export const TOP_INDIAN_CITIES = ALL_CITIES.sort();
