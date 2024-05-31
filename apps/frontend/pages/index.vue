<template>
    <div>
        <NuxtLayout>
            <div class="flex absolute items-center justify-center w-full h-full">
                <div ref="wrapper" class="w-[90%] h-[90%]">
                    <canvas ref="canvas" class="border" resize style="width: 100%; height: 100%;"></canvas>
                </div>
            </div>
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">
	import { Size } from 'paper/dist/paper-core';
	import { PullJoker } from '~/src/pullJoker';
	import _ from 'lodash';

	const wrapper = ref<HTMLDivElement>();
	const canvas = ref<HTMLCanvasElement>();
	const game = ref<PullJoker>();

	onMounted(() => {
		game.value = new PullJoker(canvas.value!);

		window.addEventListener('resize', resizeCanvas);
		resizeCanvas();
	});

	const resizeCanvas = _.debounce((() => {
		const { clientWidth, clientHeight } = wrapper.value!;

		if (!game.value || !canvas.value)
			return;

		game.value.view.viewSize = new Size(clientWidth, clientHeight);
	}), 100);
</script>