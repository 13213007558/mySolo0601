import adapter from '@sveltejs/adapter-static';

export default {
	adapter: adapter({
		fallback: 'index.html'
	})
};
