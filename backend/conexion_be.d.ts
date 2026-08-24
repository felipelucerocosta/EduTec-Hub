declare const pool: {
    query: (text: string, params?: any[]) => Promise<{
        rows: any[];
        rowCount: number;
        insertId?: undefined;
    } | {
        rows: never[];
        rowCount: number | undefined;
        insertId: number | undefined;
    }>;
};
export default pool;
