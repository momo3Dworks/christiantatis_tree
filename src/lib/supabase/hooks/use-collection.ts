
'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '../provider';

type Filter = {
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in' | 'cs' | 'cd' | 'sl' | 'sr' | 'nxl' | 'nxr' | 'adj' | 'ov' | 'fts' | 'plfts' | 'phfts' | 'wfts';
    value: any;
};

export function useSupabaseCollection(tableName: string, filters?: Filter[]) {
    const { supabase } = useSupabase();
    const [data, setData] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let query = supabase.from(tableName).select('*');

        if (filters) {
            filters.forEach((filter) => {
                // @ts-ignore
                query = query.filter(filter.column, filter.operator, filter.value);
            });
        }

        const fetchData = async () => {
            setIsLoading(true);
            const { data, error } = await query;

            if (error) {
                setError(new Error(error.message));
                setData(null);
            } else {
                setData(data);
                setError(null);
            }
            setIsLoading(false);
        };

        fetchData();

        // Realtime subscription (Optional, but mimics Firestore onSnapshot)
        const channel = supabase
            .channel(`public:${tableName}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => {
                fetchData(); // Simplest way: re-fetch on change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, tableName, JSON.stringify(filters)]);

    return { data, isLoading, error };
}
