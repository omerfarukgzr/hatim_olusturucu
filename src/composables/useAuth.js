import { ref, onMounted } from 'vue';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const user = ref(null);

export function useAuth() {

    async function signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        if (error) throw error;
        return data;
    }

    async function signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        user.value = data.user;
        return data;
    }

    async function signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        user.value = null;
    }

    async function checkUser() {
        const { data: { user: _user } } = await supabase.auth.getUser();
        user.value = _user;
        return _user;
    }

    return {
        user,
        signUp,
        signIn,
        signOut,
        checkUser,
        supabase // export for other uses if needed
    };
}
