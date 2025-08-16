const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const shortid = require('shortid');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Initialize database
const db = new sqlite3.Database('./url_shortener.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_url TEXT NOT NULL,
      short_code TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('URLs table ready');
      }
    });
  }
});

// Helper function to validate URL
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

// API Routes
// Create a shortened URL
app.post('/api/shorten', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }
  
  const shortCode = shortid.generate();
  
  db.run('INSERT INTO urls (original_url, short_code) VALUES (?, ?)',
    [url, shortCode], function(err) {
      if (err) {
        console.error('Error inserting URL:', err.message);
        return res.status(500).json({ error: 'Failed to shorten URL' });
      }
      
      const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
      res.json({ 
        original_url: url,
        short_url: shortUrl,
        short_code: shortCode
      });
    }
  );
});

// Get all URLs (for admin purposes or history)
app.get('/api/urls', (req, res) => {
  db.all('SELECT * FROM urls ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching URLs:', err.message);
      return res.status(500).json({ error: 'Failed to fetch URLs' });
    }
    
    res.json(rows);
  });
});

// Redirect to original URL
app.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  
  db.get('SELECT original_url FROM urls WHERE short_code = ?', [shortCode], (err, row) => {
    if (err) {
      console.error('Error fetching URL:', err.message);
      return res.status(500).json({ error: 'Server error' });
    }
    
    if (!row) {
      // If short code not found, redirect to home page
      return res.redirect('/');
    }
    
    // Redirect to the original URL
    res.redirect(row.original_url);
  });
});

// Start server with port conflict handling
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use, trying port ${PORT + 1}`);
    // Try the next port
    app.listen(PORT + 1, () => {
      console.log(`Server running on port ${PORT + 1}`);
    });
  } else {
    console.error('Server error:', err);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});