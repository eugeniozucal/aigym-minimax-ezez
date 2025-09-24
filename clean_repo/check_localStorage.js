// Get all localStorage data
const localStorageData = {};
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    localStorageData[key] = value;
}

console.log("=== LocalStorage Contents ===");
console.log(JSON.stringify(localStorageData, null, 2));

// Check for common session token keys
const commonTokenKeys = ['token', 'access_token', 'accessToken', 'jwt', 'session', 'sessionToken', 'authToken', 'auth_token'];
console.log("\n=== Session Token Analysis ===");

let foundTokens = [];
for (const key of commonTokenKeys) {
    const value = localStorage.getItem(key);
    if (value) {
        foundTokens.push({key, value});
        // Try to decode JWT if it looks like one
        if (value.includes('.')) {
            try {
                const parts = value.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    console.log(`JWT Token found in "${key}":`);
                    console.log(`  - Issued at: ${payload.iat ? new Date(payload.iat * 1000) : 'Not found'}`);
                    console.log(`  - Expires at: ${payload.exp ? new Date(payload.exp * 1000) : 'Not found'}`);
                    console.log(`  - Current time: ${new Date()}`);
                    if (payload.exp) {
                        const isExpired = Date.now() > (payload.exp * 1000);
                        console.log(`  - Status: ${isExpired ? 'EXPIRED' : 'VALID'}`);
                    }
                }
            } catch (e) {
                console.log(`Token in "${key}" is not a valid JWT`);
            }
        }
    }
}

if (foundTokens.length === 0) {
    console.log("No session tokens found in localStorage");
}
