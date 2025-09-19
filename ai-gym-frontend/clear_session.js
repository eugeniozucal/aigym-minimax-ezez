
// Clear localStorage and sessionStorage
localStorage.clear();
sessionStorage.clear();
// Clear all cookies
document.cookie.split(';').forEach(function(c) { 
  document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/'); 
});
// Reload the page
window.location.reload();

