import { ref } from 'vue';
import { authService } from '../services/authService';

const user = ref(null);

export function useAuth() {

    async function signUp(email, password) {
        return await authService.signUp(email, password);
    }

    async function signIn(email, password) {
        const data = await authService.signIn(email, password);
        user.value = data.user;
        return data;
    }

    async function signOut() {
        await authService.signOut();
        user.value = null;
    }

    async function checkUser() {
        const _user = await authService.getCurrentUser();
        user.value = _user;
        return _user;
    }

    return {
        user,
        signUp,
        signIn,
        signOut,
        checkUser
    };
}
