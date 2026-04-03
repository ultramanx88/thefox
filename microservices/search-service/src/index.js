const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Client } = require('@elastic/elasticsearch');
const redis = require('redis');
const Fuse = require('fuse.js');
const natural = require('natural');

const app = express();
const PORT = process.env.PORT || 3007;

// Initialize clients
const esClient = new Client({ 
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' 
});
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Search products
app.get('/search', async (req, res) => {
  try {
    const { q, category, price_min, price_max, sort, page = 1, size = 20 } = req.query;
    
    // Check cache first
    const cacheKey = `search:${JSON.stringify(req.query)}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    const searchQuery = buildElasticsearchQuery(q, category, price_min, price_max, sort);
    
    const response = await esClient.search({
      index: 'products',
      body: searchQuery,
      from: (page - 1) * size,
      size: parseInt(size)
    });
    
    const results = {
      hits: response.body.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        ...hit._source
      })),
      total: response.body.hits.total.value,
      aggregations: response.body.aggregations,
      suggestions: await getSuggestions(q)
    };
    
    // Cache results for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(results));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Autocomplete suggestions
app.get('/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    
    const suggestions = await esClient.search({
      index: 'products',
      body: {
        suggest: {
          product_suggest: {
            prefix: q,
            completion: {
              field: 'suggest',
              size: 10
            }
          }
        }
      }
    });
    
    const results = suggestions.body.suggest.product_suggest[0].options.map(option => ({
      text: option.text,
      score: option._score
    }));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Semantic search using AI
app.post('/semantic-search', async (req, res) => {
  try {
    const { query, user_id } = req.body;
    
    // Get user preferences for personalization
    const userPrefs = await getUserPreferences(user_id);
    
    // Use vector search for semantic matching
    const response = await esClient.search({
      index: 'products',
      body: {
        query: {
          script_score: {
            query: { match_all: {} },
            script: {
              source: "cosineSimilarity(params.query_vector, 'description_vector') + 1.0",
              params: {
                query_vector: await getQueryEmbedding(query)
              }
            }
          }
        },
        size: 20
      }
    });
    
    const results = response.body.hits.hits.map(hit => ({
      id: hit._id,
      score: hit._score,
      ...hit._source
    }));
    
    res.json({ results, personalized: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Index product data
app.post('/index', async (req, res) => {
  try {
    const { products } = req.body;
    
    const body = products.flatMap(product => [
      { index: { _index: 'products', _id: product.id } },
      {
        ...product,
        suggest: {
          input: [product.name, product.brand, ...product.tags],
          weight: product.popularity || 1
        },
        description_vector: await getTextEmbedding(product.description)
      }
    ]);
    
    const response = await esClient.bulk({ body });
    
    // Clear related caches
    await clearSearchCache();
    
    res.json({ indexed: products.length, errors: response.body.errors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trending searches
app.get('/trending', async (req, res) => {
  try {
    const trending = await redisClient.zRevRange('trending_searches', 0, 9, {
      WITHSCORES: true
    });
    
    const results = [];
    for (let i = 0; i < trending.length; i += 2) {
      results.push({
        query: trending[i],
        count: parseInt(trending[i + 1])
      });
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'search-service' });
});

// Helper functions
function buildElasticsearchQuery(q, category, price_min, price_max, sort) {
  const must = [];
  const filter = [];
  
  if (q) {
    must.push({
      multi_match: {
        query: q,
        fields: ['name^3', 'description^2', 'brand^2', 'tags'],
        type: 'best_fields',
        fuzziness: 'AUTO'
      }
    });
  }
  
  if (category) {
    filter.push({ term: { category } });
  }
  
  if (price_min || price_max) {
    const range = {};
    if (price_min) range.gte = parseFloat(price_min);
    if (price_max) range.lte = parseFloat(price_max);
    filter.push({ range: { price: range } });
  }
  
  const sortOptions = {
    relevance: [{ _score: { order: 'desc' } }],
    price_low: [{ price: { order: 'asc' } }],
    price_high: [{ price: { order: 'desc' } }],
    newest: [{ created_at: { order: 'desc' } }],
    popular: [{ popularity: { order: 'desc' } }]
  };
  
  return {
    query: {
      bool: { must, filter }
    },
    sort: sortOptions[sort] || sortOptions.relevance,
    aggs: {
      categories: {
        terms: { field: 'category', size: 10 }
      },
      price_ranges: {
        range: {
          field: 'price',
          ranges: [
            { to: 100 },
            { from: 100, to: 500 },
            { from: 500, to: 1000 },
            { from: 1000 }
          ]
        }
      },
      brands: {
        terms: { field: 'brand', size: 10 }
      }
    }
  };
}

async function getSuggestions(query) {
  if (!query) return [];
  
  // Use NLP for query understanding
  const tokens = natural.WordTokenizer.tokenize(query.toLowerCase());
  const stemmed = tokens.map(token => natural.PorterStemmer.stem(token));
  
  return stemmed.slice(0, 5);
}

async function getUserPreferences(userId) {
  if (!userId) return {};
  
  const prefs = await redisClient.hGetAll(`user_prefs:${userId}`);
  return prefs;
}

async function getQueryEmbedding(query) {
  // Mock embedding - in production use OpenAI/Sentence-BERT
  return new Array(384).fill(0).map(() => Math.random());
}

async function getTextEmbedding(text) {
  // Mock embedding - in production use OpenAI/Sentence-BERT
  return new Array(384).fill(0).map(() => Math.random());
}

async function clearSearchCache() {
  const keys = await redisClient.keys('search:*');
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}

// Track search queries
app.use((req, res, next) => {
  if (req.path === '/search' && req.query.q) {
    // Increment trending counter
    redisClient.zIncrBy('trending_searches', 1, req.query.q);
  }
  next();
});

redisClient.connect();

app.listen(PORT, () => {
  console.log(`Search Service running on port ${PORT}`);
});