"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCategories = useCategories;
exports.useCategoryTree = useCategoryTree;
exports.useMainCategories = useMainCategories;
exports.useSubcategories = useSubcategories;
exports.useCategoriesWithProductCount = useCategoriesWithProductCount;
exports.useCategorySearch = useCategorySearch;
const react_1 = require("react");
const categories_1 = require("../firebase/categories");
function useCategories(activeOnly = true, realtime = false) {
    const [state, setState] = (0, react_1.useState)({
        categories: [],
        loading: true,
        error: null,
    });
    (0, react_1.useEffect)(() => {
        let unsubscribe;
        const fetchCategories = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));
                if (realtime) {
                    // Set up real-time listener
                    unsubscribe = categories_1.CategoryService.onCategoriesChange((categories) => {
                        setState({
                            categories,
                            loading: false,
                            error: null,
                        });
                    });
                }
                else {
                    // One-time fetch
                    const categories = await categories_1.CategoryService.getCategories(activeOnly);
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
            const categories = await categories_1.CategoryService.getCategories(activeOnly);
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
function useCategoryTree() {
    const [state, setState] = (0, react_1.useState)({
        categoryTree: [],
        loading: true,
        error: null,
    });
    (0, react_1.useEffect)(() => {
        const fetchCategoryTree = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));
                const categoryTree = await categories_1.CategoryService.getCategoryTree();
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
            const categoryTree = await categories_1.CategoryService.getCategoryTree();
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
function useMainCategories() {
    const [state, setState] = (0, react_1.useState)({
        categories: [],
        loading: true,
        error: null,
    });
    (0, react_1.useEffect)(() => {
        const fetchMainCategories = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));
                const categories = await categories_1.CategoryService.getMainCategories();
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
            const categories = await categories_1.CategoryService.getMainCategories();
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
function useSubcategories(parentId) {
    const [state, setState] = (0, react_1.useState)({
        categories: [],
        loading: true,
        error: null,
    });
    (0, react_1.useEffect)(() => {
        if (!parentId) {
            setState({ categories: [], loading: false, error: null });
            return;
        }
        const fetchSubcategories = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));
                const categories = await categories_1.CategoryService.getSubcategories(parentId);
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
            const categories = await categories_1.CategoryService.getSubcategories(parentId);
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
function useCategoriesWithProductCount() {
    const [state, setState] = (0, react_1.useState)({
        categories: [],
        loading: true,
        error: null,
    });
    (0, react_1.useEffect)(() => {
        const fetchCategoriesWithCount = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));
                const categories = await categories_1.CategoryService.getCategoriesWithProductCount();
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
            const categories = await categories_1.CategoryService.getCategoriesWithProductCount();
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
function useCategorySearch() {
    const [state, setState] = (0, react_1.useState)({
        categories: [],
        loading: false,
        error: null,
        searchTerm: '',
    });
    const searchCategories = async (searchTerm) => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null, searchTerm }));
            const categories = await categories_1.CategoryService.searchCategories(searchTerm);
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
