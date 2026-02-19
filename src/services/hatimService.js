import { supabase } from '../supabase';

export const hatimService = {
    async getAllByUser(userId) {
        const { data, error } = await supabase
            .from('hatims')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('hatims')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(hatimData) {
        const { data, error } = await supabase
            .from('hatims')
            .insert([hatimData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { error } = await supabase
            .from('hatims')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async delete(id) {
        const { error } = await supabase
            .from('hatims')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
