export default defineNuxtConfig({
  // 1. FIX: Menghilangkan warning compatibilityDate
  compatibilityDate: "2024-04-03",

  devtools: { enabled: true },
  modules: ["@pinia/nuxt", "@vueuse/nuxt"],

  css: ["~/assets/css/main.css", "leaflet/dist/leaflet.css"],

  // 2. FIX UTAMA: Menghilangkan error "Failed to resolve component"
  // Mematikan prefix folder agar <AppSidebar> langsung dikenali
  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],

  // 3. FIX: Redirect otomatis dari '/' ke '/overview'
  routeRules: {
    "/": { redirect: "/overview" },
  },

  app: {
    head: {
      title: "TELKOM-NETGUARD — Network Intelligence",
      meta: [
        {
          name: "description",
          content:
            "AI-powered network monitoring, anomaly detection, and predictive analytics dashboard.",
        },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        },
      ],
    },
  },

  // 4. FIX: Mengganti file postcss.config.js yang tidak didukung Nuxt
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  typescript: { strict: true, shim: false },

  // 5. FIX CRITICAL: Mematikan appManifest untuk mencegah error "#app-manifest"
  experimental: {
    appManifest: false,
  },

  // 6. FIX UTAMA HYBRID MODE: Konfigurasi Environment Variables
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "/api",

      //  PAKSA FALSE - Memaksa mode Hybrid aktif (bypass .env)
      // Ini memastikan badge bisa berubah jadi DEGRADED saat RIPE gagal
      useMock: false,

      // 5 menit (300000ms) untuk menghindari rate limit RIPE Atlas (100 req/jam)
      pollInterval: Number(process.env.NUXT_PUBLIC_POLL_INTERVAL) || 300000,

      // ✅ WAJIB ADA: Agar tidak menjadi 'undefined' saat fetch ke RIPE Atlas
      ripeBase:
        process.env.NUXT_PUBLIC_RIPE_BASE || "https://atlas.ripe.net/api/v2",

      // Opsional: Jika kamu sudah daftar dan dapat API Key dari RIPE Atlas
      ripeApiKey: process.env.NUXT_PUBLIC_RIPE_API_KEY || "",
    },
  },

  vite: {
    optimizeDeps: { include: ["echarts", "vue-echarts", "leaflet"] },
  },
});
