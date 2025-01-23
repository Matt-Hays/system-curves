<template>
	<div>
		<NuxtRouteAnnouncer />
		<NuxtWelcome />
	</div>
</template>

<script setup lang="ts">
import PipeSection from '~/models/PipeSection';
import System from '~/models/System';

const s = new System();
s.addPipeSection([10, 10, 0, 10, 0, 10, 0, 10, 100, 2, 0.00001, 0.0001, 3, [3, 1, 2, 1]]);
s.addPipeSection([10, 10, 0, 10, 0, 10, 0, 10, 100, 2, 0.00001, 0.0001, 3, [3, 1, 2, 1]]);
console.log(s.calcTDH());
</script>
