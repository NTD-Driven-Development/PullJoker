// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
	devServer: {
		port: 3011,
	},
	css: ['~/assets/css/main.css'],
    postcss: {
		plugins: {
			tailwindcss: {},
			autoprefixer: {},
		},
    },
	ssr: false,
	modules: [
		'@pinia/nuxt',
    ],
})
