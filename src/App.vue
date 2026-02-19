<template>
  <RouterView />
  <ToastNotification />
</template>

<script setup>
import { RouterView } from 'vue-router';
import ToastNotification from './components/ToastNotification.vue';
import { useTheme } from './composables/useTheme';
import { onMounted } from 'vue';

const { initTheme } = useTheme();

onMounted(() => {
  initTheme();
});
</script>
