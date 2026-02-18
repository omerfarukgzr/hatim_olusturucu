<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo">📖</div>
      <h1 class="title">{{ isSignUp ? 'Hesap Oluştur' : 'Giriş Yap' }}</h1>
      <p class="subtitle">Hatimlerinizi yönetmek için devam edin</p>

      <form @submit.prevent="handleSubmit" class="form">
        <div class="field-group">
          <label class="field-label">E-posta</label>
          <input 
            v-model="email" 
            type="email" 
            class="field-input" 
            placeholder="ornek@mail.com" 
            required 
          />
        </div>

        <div class="field-group">
          <label class="field-label">Şifre</label>
          <input 
            v-model="password" 
            type="password" 
            class="field-input" 
            placeholder="••••••••" 
            required 
          />
        </div>

        <button :disabled="loading" class="btn btn-primary w-full">
          {{ loading ? 'Bekleyin...' : (isSignUp ? 'Kayıt Ol' : 'Giriş Yap') }}
        </button>
      </form>

      <div class="toggle-text">
        <span v-if="!isSignUp">Hesabınız yok mu? <a @click="isSignUp = true">Kayıt Ol</a></span>
        <span v-else>Zaten hesabınız var mı? <a @click="isSignUp = false">Giriş Yap</a></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';
import { useRouter } from 'vue-router';
import { useToast } from '../composables/useToast';

const { signIn, signUp } = useAuth();
const router = useRouter();
const { show } = useToast();

const email = ref('');
const password = ref('');
const isSignUp = ref(false);
const loading = ref(false);

async function handleSubmit() {
  loading.value = true;
  try {
    if (isSignUp.value) {
      await signUp(email.value, password.value);
      show('Kayıt başarılı! Lütfen giriş yapın.', 'success');
      isSignUp.value = false;
    } else {
      await signIn(email.value, password.value);
      show('Giriş yapıldı!', 'success');
      router.push('/');
    }
  } catch (e) {
    show(e.message, 'error');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--bg);
  padding: 20px;
}
.login-card {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 40px;
  border-radius: var(--radius);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
  text-align: center;
}
.logo { font-size: 48px; margin-bottom: 20px; }
.title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
.subtitle { color: var(--text-muted); font-size: 14px; margin-bottom: 32px; }
.form { display: flex; flex-direction: column; gap: 20px; }
.field-group { text-align: left; }
.field-label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--text-muted); }
.field-input {
  width: 100%;
  background: var(--surface2);
  border: 1px solid var(--border);
  padding: 12px;
  border-radius: var(--radius-sm);
  color: var(--text);
  outline: none;
}
.field-input:focus { border-color: var(--accent); }
.w-full { width: 100%; margin-top: 10px; }
.toggle-text { margin-top: 24px; font-size: 14px; color: var(--text-muted); }
.toggle-text a { color: var(--accent); cursor: pointer; font-weight: 600; }
</style>
