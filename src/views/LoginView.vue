<template>
  <div class="login-container">
    <div class="top-right-toggle">
      <ThemeToggle />
    </div>
    <div class="login-card">
      <div class="logo">
        <img src="../assets/logo.png" alt="Hatim Takip Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 20px;" />
      </div>
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
        <!-- <span v-if="!isSignUp">Hesabınız yok mu? <a @click="isSignUp = true">Kayıt Ol</a></span>
        <span v-else>Zaten hesabınız var mı? <a @click="isSignUp = false">Giriş Yap</a></span> -->
        <span v-if="!isSignUp">Misafir olarak devam etmek için <a @click="$router.push('/')">tıklayın</a></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';
import { useRouter } from 'vue-router';
import { useToast } from '../composables/useToast';
import ThemeToggle from '../components/ThemeToggle.vue';

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
  padding: 24px;
  position: relative;
}
.top-right-toggle {
    position: absolute;
    top: 24px;
    right: 24px;
}
.login-card {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  padding: 48px;
  border-radius: var(--radius);
  width: 100%;
  max-width: 440px;
  box-shadow: var(--shadow-lg);
  text-align: center;
}
.logo { 
  font-size: 52px; 
  margin-bottom: 24px; 
  display: inline-flex;
  background: var(--accent-soft);
  width: 80px;
  height: 80px;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  border: 1px solid var(--border-soft);
}
.title { 
  font-family: 'Lora', serif;
  font-size: 28px; 
  font-weight: 700; 
  margin-bottom: 12px; 
  color: var(--accent);
}
.subtitle { color: var(--text-muted); font-size: 15px; margin-bottom: 40px; }
.form { display: flex; flex-direction: column; gap: 24px; }
.field-group { text-align: left; }
.field-label { display: block; font-size: 12px; font-weight: 700; margin-bottom: 8px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.05em; }
.field-input {
  width: 100%;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  padding: 14px;
  border-radius: var(--radius-md);
  color: var(--text);
  outline: none;
  font-size: 15px;
}
.field-input:focus { border-color: var(--accent); background: #fff; box-shadow: 0 0 0 4px var(--accent-soft); }
.w-full { width: 100%; margin-top: 12px; }
.toggle-text { margin-top: 28px; font-size: 14px; color: var(--text-muted); }
.toggle-text a { color: var(--accent); cursor: pointer; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; }
</style>
