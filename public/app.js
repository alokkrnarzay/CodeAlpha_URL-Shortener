document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const urlForm = document.getElementById('url-form');
  const urlInput = document.getElementById('url-input');
  const resultContainer = document.getElementById('result-container');
  const shortUrlLink = document.getElementById('short-url-link');
  const copyBtn = document.getElementById('copy-btn');
  const newUrlBtn = document.getElementById('new-url-btn');
  const errorContainer = document.getElementById('error-container');
  const errorMessage = document.getElementById('error-message');

  // Event Listeners
  urlForm.addEventListener('submit', handleFormSubmit);
  copyBtn.addEventListener('click', copyToClipboard);
  newUrlBtn.addEventListener('click', resetForm);

  // Form submission handler
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    const url = urlInput.value.trim();
    
    if (!url) {
      showError('Please enter a URL');
      return;
    }

    try {
      // Show loading state (could add a spinner here)
      urlInput.disabled = true;
      
      // Make API request to shorten URL
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to shorten URL');
      }
      
      // Display the shortened URL
      showResult(data.short_url);
    } catch (error) {
      showError(error.message);
      urlInput.disabled = false;
    }
  }

  // Function to copy shortened URL to clipboard
  function copyToClipboard() {
    const shortUrl = shortUrlLink.href;
    
    navigator.clipboard.writeText(shortUrl)
      .then(() => {
        // Visual feedback for copy success
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      })
      .catch(err => {
        showError('Failed to copy URL');
        console.error('Copy failed:', err);
      });
  }

  // Function to reset the form for a new URL
  function resetForm() {
    urlInput.value = '';
    urlInput.disabled = false;
    resultContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    urlInput.focus();
  }

  // Function to display the shortened URL result
  function showResult(shortUrl) {
    // Hide any previous errors
    errorContainer.style.display = 'none';
    
    // Update and display result
    shortUrlLink.href = shortUrl;
    shortUrlLink.textContent = shortUrl;
    resultContainer.style.display = 'block';
  }

  // Function to display error messages
  function showError(message) {
    errorMessage.textContent = message;
    errorContainer.style.display = 'block';
    resultContainer.style.display = 'none';
  }
});