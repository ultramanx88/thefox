// Mock API function. In a real app, this would fetch data from your backend.
export const getCategories = async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
        { id: '1', name: 'Vegetables & Fruits', slug: 'vegetables-fruits' },
        { id: '2', name: 'Meat & Seafood', slug: 'meat-seafood' },
        { id: '3', name: 'Bakery & Dairy', slug: 'bakery-dairy' },
        { id: '4', name: 'Pantry Staples', slug: 'pantry-staples' },
        { id: '5', name: 'Beverages', slug: 'beverages' },
        { id: '6', name: 'Snacks & Sweets', slug: 'snacks-sweets' },
    ];
};
