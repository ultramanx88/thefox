import { AxiosRequestConfig } from 'axios';
export declare class ApiClient {
    private client;
    constructor(baseURL?: string);
    private setupInterceptors;
    private getAuthToken;
    setAuthToken(token: string | null): void;
    private handleUnauthorized;
    request<T>(config: AxiosRequestConfig): Promise<T>;
    get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}
export declare const apiClient: ApiClient;
