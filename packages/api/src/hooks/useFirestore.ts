import { useState, useEffect } from 'react';
import { FirestoreService } from '../firebase/firestore';
import { WhereFilterOp, OrderByDirection } from 'firebase/firestore';

export interface FirestoreState<T> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
}

export function useFirestoreCollection<T>(
  collectionName: string,
  filters?: Array<{ field: string; operator: WhereFilterOp; value: any }>,
  orderByField?: string,
  orderDirection: OrderByDirection = 'asc',
  realtime: boolean = false
) {
  const [state, setState] = useState<FirestoreState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        if (realtime) {
          // Set up real-time listener
          unsubscribe = FirestoreService.onSnapshot<T>(
            collectionName,
            (data) => {
              setState({
                data,
                loading: false,
                error: null,
              });
            },
            filters,
            orderByField,
            orderDirection
          );
        } else {
          // One-time fetch
          const data = await FirestoreService.query<T>(
            collectionName,
            filters,
            orderByField,
            orderDirection
          );
          setState({
            data,
            loading: false,
            error: null,
          });
        }
      } catch (error: any) {
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
      const data = await FirestoreService.query<T>(
        collectionName,
        filters,
        orderByField,
        orderDirection
      );
      setState({
        data,
        loading: false,
        error: null,
      });
    } catch (error: any) {
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

export function useFirestoreDocument<T>(collectionName: string, docId: string | null) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!docId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const fetchDocument = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const data = await FirestoreService.read<T>(collectionName, docId);
        setState({
          data,
          loading: false,
          error: null,
        });
      } catch (error: any) {
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
    if (!docId) return;
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await FirestoreService.read<T>(collectionName, docId);
      setState({
        data,
        loading: false,
        error: null,
      });
    } catch (error: any) {
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