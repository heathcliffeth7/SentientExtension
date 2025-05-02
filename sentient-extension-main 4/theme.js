// Theme switching functionality
document.addEventListener('DOMContentLoaded', function() {
  const themeSwitch = document.getElementById('themeSwitch');
  const themeIcon = document.getElementById('themeIcon');
  
  // Check for saved theme preference or use default light theme
  const savedTheme = localStorage.getItem('sentientTheme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeSwitch.checked = true;
    updateThemeIcon(true);
  }
  
  // Theme switch event listener
  themeSwitch.addEventListener('change', function() {
    if (this.checked) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('sentientTheme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('sentientTheme', 'light');
    }
    updateThemeIcon(this.checked);
  });
  
  // Update theme icon based on current theme
  function updateThemeIcon(isDark) {
    if (isDark) {
      themeIcon.innerHTML = '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>';
    } else {
      themeIcon.innerHTML = '<path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>';
    }
  }
});
