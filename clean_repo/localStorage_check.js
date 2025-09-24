// Check localStorage contents
console.log("=== Checking localStorage for session tokens ===");

// Get all localStorage entries
const allStorage = {};
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    allStorage[key] = value;
}

console.log("All localStorage entries:", JSON.stringify(allStorage, null, 2));

// Check for common token patterns
const tokenKeys = ['token', 'access_token', 'accessToken', 'jwt', 'session', 'sessionToken', 'auth_token', 'authToken'];
let foundTokens = [];

for (const key of tokenKeys) {
    const value = localStorage.getItem(key);
    if (value) {
        foundTokens.push({key, value});
    }
}

// Also check all keys for JWT-like patterns (contains dots)
Object.entries(allStorage).forEach(([key, value]) => {
    if (typeof value === 'string' && value.includes('.') && value.split('.').length === 3) {
        try {
            const parts = value.split('.');
            const header = JSON.parse(atob(parts[0]));
            const payload = JSON.parse(atob(parts[1]));
            
            console.log(`\n=== JWT Token found in "${key}" ===`);
            console.log("Header:", JSON.stringify(header, null, 2));
            console.log("Payload:", JSON.stringify(payload, null, 2));
            
            if (payload.exp) {
                const expDate = new Date(payload.exp * 1000);
                const currentTime = new Date();
                const isExpired = currentTime > expDate;
                
                console.log(`Issued at: ${payload.iat ? new Date(payload.iat * 1000).toISOString() : 'Not specified'}`);
                console.log(`Expires at: ${expDate.toISOString()}`);
                console.log(`Current time: ${currentTime.toISOString()}`);
                console.log(`Status: ${isExpired ? 'EXPIRED' : 'VALID'}`);
                console.log(`Time until expiry: ${isExpired ? 'Already expired' : Math.round((expDate - currentTime) / (1000 * 60)) + ' minutes'}`);
            }
        } catch (e) {
            console.log(`Token in "${key}" looks like JWT but couldn't decode:`, e.message);
        }
    }
});

if (Object.keys(allStorage).length === 0) {
    console.log("No data found in localStorage");
} else {
    console.log(`\nTotal localStorage entries: ${Object.keys(allStorage).length}`);
}
