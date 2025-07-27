import { WhereFilterOp, OrderByDirection } from 'firebase/firestore';
export interface FirestoreState<T> {
    data: T[] | null;
    loading: boolean;
    error: string | null;
}
export declare function useFirestoreCollection<T>(collectionName: string, filters?: Array<{
    field: string;
    operator: WhereFilterOp;
    value: any;
}>, orderByField?: string, orderDirection?: OrderByDirection, realtime?: boolean): {
    refetch: () => Promise<void>;
    data: T[] | null;
    loading: boolean;
    error: string | null;
};
export declare function useFirestoreDocument<T>(collectionName: string, docId: string | null): {
    refetch: () => Promise<void>;
    data: T | null;
    loading: boolean;
    error: string | null;
};
