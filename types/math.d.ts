import * as math from 'mathjs';

declare module '#app' {
	interface NuxtApp {
		$math: typeof math;
	}
}

declare module 'vue' {
	interface ComponentCustomProperties {
		$math: typeof math;
	}
}
