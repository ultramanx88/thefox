'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, MessageCircle, User, Tag } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
  commentsCount: number;
}

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const categories = ['all', 'cooking', 'nutrition', 'recipes', 'organic'];
  
  const posts: BlogPost[] = [
    {
      id: '1',
      title: 'Cooking tips make cooking simple',
      excerpt: 'Discover essential cooking techniques that will transform your kitchen experience and make meal preparation effortless.',
      content: 'Full content here...',
      image: '/api/placeholder/400/250',
      author: 'Chef Maria',
      publishedAt: '2024-01-15',
      category: 'cooking',
      tags: ['tips', 'beginner', 'kitchen'],
      commentsCount: 12
    },
    {
      id: '2',
      title: '6 ways to prepare breakfast for 30',
      excerpt: 'Learn efficient methods to prepare nutritious breakfast for large groups without compromising on taste or quality.',
      content: 'Full content here...',
      image: '/api/placeholder/400/250',
      author: 'John Smith',
      publishedAt: '2024-01-10',
      category: 'recipes',
      tags: ['breakfast', 'bulk-cooking', 'meal-prep'],
      commentsCount: 8
    },
    {
      id: '3',
      title: 'Visit the clean farm in the US',
      excerpt: 'Take a virtual tour of organic farms across America and learn about sustainable farming practices.',
      content: 'Full content here...',
      image: '/api/placeholder/400/250',
      author: 'Sarah Johnson',
      publishedAt: '2024-01-05',
      category: 'organic',
      tags: ['farming', 'organic', 'sustainability'],
      commentsCount: 15
    }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">From The Blog</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover cooking tips, recipes, and insights about organic living from our expert contributors.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full capitalize ${
                selectedCategory === category
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm capitalize">
                    {post.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                  <MessageCircle className="h-4 w-4 ml-4 mr-1" />
                  <span>{post.commentsCount}</span>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-3 hover:text-green-600">
                  <Link href={`/blog/${post.id}`}>
                    {post.title}
                  </Link>
                </h2>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1" />
                    <span>{post.author}</span>
                  </div>
                  
                  <Link 
                    href={`/blog/${post.id}`}
                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    Read More →
                  </Link>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="bg-white rounded-lg shadow-sm p-8 mt-12 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Stay Updated</h3>
          <p className="text-gray-600 mb-6">Get the latest recipes and cooking tips delivered to your inbox.</p>
          <div className="flex max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 border rounded-l-lg"
            />
            <button className="bg-green-600 text-white px-6 py-2 rounded-r-lg hover:bg-green-700">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}