declare const pool: {
    query: (text: string, params?: any[]) => Promise<{
        rows: any[];
        rowCount: number;
        insertId: null;
    } | {
        rows: any[];
        rowCount: number;
        insertId: number | undefined;
    }>;
};
export default pool;
