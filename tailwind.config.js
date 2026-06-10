/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				construction: {
					orange: '#F59E0B',
					'orange-light': '#FBBF24',
					'orange-dark': '#D97706',
					blue: '#1E3A8A',
					'blue-light': '#3B82F6',
					'blue-dark': '#1E40AF',
					gray: '#6B7280',
					'gray-light': '#E5E7EB',
					'gray-dark': '#374151'
				}
			},
			fontFamily: {
				sans: ['Noto Sans SC', 'sans-serif']
			}
		}
	},
	plugins: []
};
