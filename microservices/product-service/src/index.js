const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const { CacheManager, createCacheMiddleware } = require('../shared/cacheManager');

const app = express();
const PORT = process.env.PORT || 3002;
const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://search-service:3007';

// Initialize cache
const cacheManager = new CacheManager({
  memoryTTL: 300,
  maxKeys: 5000
});
const cache = createCacheMiddleware(cacheManager);

app.use(helmet());
app.use(cors());
app.use(express.json());

// Products with search integration and caching
app.get('/products', cache(600), async (req, res) => {
  try {
    const { q, category, price_min, price_max, sort } = req.query;
    
    // If search query exists, use search service
    if (q) {
      const searchResponse = await axios.get(`${SEARCH_SERVICE_URL}/search`, {
        params: req.query
      });
      return res.json(searchResponse.data);
    }
    
    // Otherwise use database with caching
    const products = await getProducts(req.query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/products/:id', cache(1800), async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Categories with long cache
app.get('/categories', cache(3600), async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new product with search indexing and cache invalidation
app.post('/products', async (req, res) => {
  try {
    const product = await createProduct(req.body);
    
    // Clear related caches
    await cacheManager.clear('products');
    await cacheManager.clear('categories');
    
    // Index to search service
    await axios.post(`${SEARCH_SERVICE_URL}/index`, {
      products: [product]
    });
    
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product with search re-indexing and cache invalidation
app.put('/products/:id', async (req, res) => {
  try {
    const product = await updateProduct(req.params.id, req.body);
    
    // Clear related caches
    await cacheManager.del(`cache:/products/${req.params.id}`);
    await cacheManager.clear('products');
    
    // Re-index to search service
    await axios.post(`${SEARCH_SERVICE_URL}/index`, {
      products: [product]
    });
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'product-service' });
});

// Mock functions
async function getProducts(query) {
  return [{ id: 1, name: 'Sample Product', price: 100 }];
}

async function getProductById(id) {
  return { id, name: 'Sample Product', price: 100 };
}

async function getCategories() {
  return [{ id: 1, name: 'Electronics' }];
}

async function createProduct(productData) {
  return { id: Date.now(), ...productData };
}

async function updateProduct(id, productData) {
  return { id, ...productData };
}

app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});