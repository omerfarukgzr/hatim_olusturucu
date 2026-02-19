import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import HatimDetailView from '../views/HatimDetailView.vue';
import LoginView from '../views/LoginView.vue';
import { useAuth } from '../composables/useAuth';

const routes = [
    {
        path: '/login',
        name: 'login',
        component: LoginView
    },
    {
        path: '/',
        name: 'home',
        component: HomeView
        // meta: { requiresAuth: true }
    },
    {
        path: '/hatim/:id',
        name: 'detail',
        component: HatimDetailView
        // No requiresAuth here so shared links work
    },
    {
        path: '/takip',
        name: 'participant-login',
        component: () => import('../views/ParticipantView.vue')
    },
    {
        path: '/takip/:id',
        name: 'participant-detail',
        component: () => import('../views/ParticipantView.vue')
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

router.beforeEach(async (to) => {
    const { checkUser } = useAuth();
    const user = await checkUser();

    if (to.meta.requiresAuth && !user) {
        return { name: 'login' };
    }

    if (to.name === 'login' && user) {
        return { name: 'home' };
    }
});

export default router;
