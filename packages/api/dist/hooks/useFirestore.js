"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFirestoreCollection = useFirestoreCollection;
exports.useFirestoreDocument = useFirestoreDocument;
const react_1 = require("react");
const firestore_1 = require("../firebase/firestore");
function useFirestoreCollection(collectionName, filters, orderByField, orderDirection = 'asc', realtime = false) {
    const [state, setState] = (0, react_1.useState)({
        data: null,
        loading: true,
        error: null,
    });
    (0, react_1.useEffect)(() => {
        let unsubscribe;
        const fetchData = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));
                if (realtime) {
                    // Set up real-time listener
                    unsubscribe = firestore_1.FirestoreService.onSnapshot(collectionName, (data) => {
                        setState({
                            data,
                            loading: false,
                            error: null,
                        });
                    }, filters, orderByField, orderDirection);
                }
                else {
                    // One-time fetch
                    const data = await firestore_1.FirestoreService.query(collectionName, filters, orderByField, orderDirection);
                    setState({
                        data,
                        loading: false,
                        error: null,
                    });
                }
            }
            catch (error) {
                setState({
                    data: null,
                    loading: false,
                    error: error.message || 'Failed to fetch data',
                });
            }
        };
        fetchData();
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [collectionName, JSON.stringify(filters), orderByField, orderDirection, realtime]);
    const refetch = async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const data = await firestore_1.FirestoreService.query(collectionName, filters, orderByField, orderDirection);
            setState({
                data,
                loading: false,
                error: null,
            });
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Failed to refetch data',
            }));
        }
    };
    return {
        ...state,
        refetch,
    };
}
function useFirestoreDocument(collectionName, docId) {
    const [state, setState] = (0, react_1.useState)({
        data: null,
        loading: true,
        error: null,
    });
    (0, react_1.useEffect)(() => {
        if (!docId) {
            setState({ data: null, loading: false, error: null });
            return;
        }
        const fetchDocument = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));
                const data = await firestore_1.FirestoreService.read(collectionName, docId);
                setState({
                    data,
                    loading: false,
                    error: null,
                });
            }
            catch (error) {
                setState({
                    data: null,
                    loading: false,
                    error: error.message || 'Failed to fetch document',
                });
            }
        };
        fetchDocument();
    }, [collectionName, docId]);
    const refetch = async () => {
        if (!docId)
            return;
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const data = await firestore_1.FirestoreService.read(collectionName, docId);
            setState({
                data,
                loading: false,
                error: null,
            });
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Failed to refetch document',
            }));
        }
    };
    return {
        ...state,
        refetch,
    };
}
