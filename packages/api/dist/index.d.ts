export type Category = {
    id: string;
    name: string;
    slug: string;
};
export declare const getCategories: () => Promise<Category[]>;
