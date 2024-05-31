export const useIndexStore = defineStore('index', () => {
    const init = async () => {
        await waitSocketConnected();
    }

    const waitSocketConnected = () => new Promise((r) => {
		// if (app.lobbySocket?.connected)
		// 	r(true);

		// const stopHandle = watch(() => app.lobbySocket, (socket) => {
		// 	socket?.once('connect', () => {
		// 		stopHandle && stopHandle();
		// 		r(true);
		// 	});
		// });
	});

    const state = reactive<State>({});

	return { state, init }
});

interface State {
}