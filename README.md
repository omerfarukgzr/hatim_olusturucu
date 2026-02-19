# 📖 Hatim Takip Paneli

Kur'an-ı Kerim hatim organizasyonlarını yönetmek, katılımcıların sayfa dağılımını takip etmek ve profesyonel çıktılar
(Excel/PDF) almak için geliştirilmiş modern bir web uygulamasıdır.

## ✨ Özellikler

- **Multi-User Desteği:** Supabase Auth ile güvenli giriş ve kayıt sistemi.
- **Kişisel Hatim Listesi:** Her kullanıcı sadece kendi oluşturduğu hatimleri yönetir.
- **Dinamik Hesaplama:** 604 sayfalık tam hatim üzerinden kalan sayfa ve ilerleme yüzdesi takibi.
- **Gelişmiş Dışa Aktarma:**
- **Excel:** Calibri fontunda, tarih ve gün bazlı profesyonel çizelge.
- **PDF:** Dinamik ölçeklendirmeli, tek sayfaya sığdırılmış ve yazdırmaya hazır çıktı.
- **Responsive Tasarım:** Mobil, tablet ve masaüstü uyumlu modern arayüz (Dark Mode/Glassmorphism).

## 🚀 Teknolojiler

Aşağıdaki modern teknolojiler kullanılarak geliştirilmiştir:

- **Frontend:** [Vue.js 3](https://vuejs.org/) (Composition API)
- **Veritabanı & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** Vanilla CSS (Modern CSS değişkenleri ve tasarımsal estetik)
- **Deployment:** GitHub Actions & GitHub Pages
- **Kütüphaneler:**
- `exceljs`: Karmaşık Excel dosyaları üretimi için.
- `pdfmake`: Dinamik PDF çıktısı üretimi için.
- `vue-router`: Sayfalar arası geçiş ve korumalı rotalar için.

## 📂 Proje Mimarisi

Proje, sürdürülebilir ve ölçeklenebilir bir katmanlı mimariye (Layered Architecture) sahiptir:

- `src/services/`: Veritabanı ve Auth API çağrıları.
- `src/utils/`: PDF/Excel motorları ve tarih hesaplama araçları.
- `src/composables/`: Vue bileşenleri için reaktif mantık katmanı.
- `src/constants/`: Uygulama genelindeki sabit değerler.
- `src/views/`: Sayfa bazlı bileşenler.
- `src/components/`: Tekrar kullanılabilir arayüz elemanları.

## 🛠 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js (v18+)
- Supabase Hesabı

### Yerel Çalıştırma
1. Projeyi klonlayın:
```bash
git clone https://github.com/omerfarukgzr/hatim_olusturucu.git
cd hatim_olusturucu
```
2. Bağımlılıkları yükleyin:
```bash
npm install
```
3. `.env.example` dosyasını `.env` olarak kopyalayın ve Supabase anahtarlarınızı girin:
```bash
cp .env.example .env
```
4. Uygulamayı başlatın:
```bash
npm run dev
```

## 🔐 Veritabanı (Supabase) Kurulumu

Tablo yapısını oluşturmak için Supabase SQL Editor üzerinden aşağıdaki komutu çalıştırın:

```sql
create table hatims (
id uuid default gen_random_uuid() primary key,
created timestamp with time zone default now(),
name text,
"startDate" text,
"endDate" text,
participants jsonb default '[]'::jsonb,
user_id uuid references auth.users(id)
);

alter table hatims enable row level security;
-- RLS kurallarını eklemeyi unutmayın (README detayında basitleştirilmiştir)
```

## 📄 Lisans
Bu proje [MIT](LICENSE) lisansı ile korunmaktadır.
