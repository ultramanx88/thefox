import { useState, useEffect } from 'react';
import { CategoryService } from '../firebase/categories';
export function useCategories(activeOnly = true, realtime = false) {
    const [state, setState] = useState({
        categories: [],
        loading: true,
        error: null,
    });
    useEffect(() => {
        let unsubscribe;
        const fetchCategories = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));
                if (realtime) {
                    // Set up real-time listener
                    unsubscribe = CategoryService.onCategoriesChange((categories) => {
                        setState({
                            categories,
                            loading: false,
                            error: null,
                        });
                    });
                }
                else {
                    // One-time fetch
                    const categories = await CategoryService.getCategories(activeOnly);
                    setState({
                        categories,
                        loading: false,
                        error: null,
                    });
                }
            }
            catch (error) {
                setState({
                    categories: [],
                    loading: false,
                    error: error.message || 'Failed to fetch categories',
                });
            }
        };
        fetchCategories();
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [activeOnly, realtime]);
    const refetch = async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const categories = await CategoryService.getCategories(activeOnly);
            setState({
                categories,
                loading: false,
                error: null,
            });
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Failed to refetch categories',
            }));
        }
    };
    return {
        ...state,
        refetch,
    };
}
export function useCategoryTree() {
    const [state, setState] = useState({
        categoryTree: [],
        loading: true,
        error: null,
    });
    useEffect(() => {
        const fetchCategoryTree = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));
                const categoryTree = await CategoryService.getCategoryTree();
                setState({
                    categoryTree,
                    loading: false,
                    error: null,
                });
            }
            catch (error) {
                setState({
                    categoryTree: [],
                    loading: false,
                    error: error.message || 'Failed to fetch category tree',
                });
            }
        };
        fetchCategoryTree();
    }, []);
    const refetch = async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const categoryTree = await CategoryService.getCategoryTree();
            setState({
                categoryTree,
                loading: false,
                error: null,
            });
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Failed to refetch category tree',
            }));
        }
    };
    return {
        ...state,
        refetch,
    };
}
export function useMainCategories() {
    const [state, setState] = useState({
        categories: [],
        loading: true,
        error: null,
    });
    useEffect(() => {
        const fetchMainCategories = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));
                const categories = await CategoryService.getMainCategories();
                setState({
                    categories,
                    loading: false,
                    error: null,
                });
            }
            catch (error) {
                setState({
                    categories: [],
                    loading: false,
                    error: error.message || 'Failed to fetch main categories',
                });
            }
        };
        fetchMainCategories();
    }, []);
    const refetch = async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const categories = await CategoryService.getMainCategories();
            setState({
                categories,
                loading: false,
                error: null,
            });
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Failed to refetch main categories',
            }));
        }
    };
    return {
        ...state,
        refetch,
    };
}
export function useSubcategories(parentId) {
    const [state, setState] = useState({
        categories: [],
        loading: true,
        error: null,
    });
    useEffect(() => {
        if (!parentId) {
            setState({ categories: [], loading: false, error: null });
            return;
        }
        const fetchSubcategories = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));
                const categories = await CategoryService.getSubcategories(parentId);
                setState({
                    categories,
                    loading: false,
                    error: null,
                });
            }
            catch (error) {
                setState({
                    categories: [],
                    loading: false,
                    error: error.message || 'Failed to fetch subcategories',
                });
            }
        };
        fetchSubcategories();
    }, [parentId]);
    const refetch = async () => {
        if (!parentId)
            return;
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const categories = await CategoryService.getSubcategories(parentId);
            setState({
                categories,
                loading: false,
                error: null,
            });
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Failed to refetch subcategories',
            }));
        }
    };
    return {
        ...state,
        refetch,
    };
}
export function useCategoriesWithProductCount() {
    const [state, setState] = useState({
        categories: [],
        loading: true,
        error: null,
    });
    useEffect(() => {
        const fetchCategoriesWithCount = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));
                const categories = await CategoryService.getCategoriesWithProductCount();
                setState({
                    categories,
                    loading: false,
                    error: null,
                });
            }
            catch (error) {
                setState({
                    categories: [],
                    loading: false,
                    error: error.message || 'Failed to fetch categories with product count',
                });
            }
        };
        fetchCategoriesWithCount();
    }, []);
    const refetch = async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const categories = await CategoryService.getCategoriesWithProductCount();
            setState({
                categories,
                loading: false,
                error: null,
            });
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Failed to refetch categories with product count',
            }));
        }
    };
    return {
        ...state,
        refetch,
    };
}
export function useCategorySearch() {
    const [state, setState] = useState({
        categories: [],
        loading: false,
        error: null,
        searchTerm: '',
    });
    const searchCategories = async (searchTerm) => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null, searchTerm }));
            const categories = await CategoryService.searchCategories(searchTerm);
            setState(prev => ({
                ...prev,
                categories,
                loading: false,
                error: null,
            }));
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                categories: [],
                loading: false,
                error: error.message || 'Failed to search categories',
            }));
        }
    };
    const clearSearch = () => {
        setState({
            categories: [],
            loading: false,
            error: null,
            searchTerm: '',
        });
    };
    return {
        ...state,
        searchCategories,
        clearSearch,
    };
}
