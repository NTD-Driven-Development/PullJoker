import { Server } from '@packages/socket'

/* eslint-disable @typescript-eslint/no-explicit-any */
export const SocketThrow = (target: any, propertyKey: string, descriptor: any) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
        const socket = this.socket as Server
        try {
            return await originalMethod.apply(this, args)
        } catch (error: any) {
            console.error('Error encountered:', error.message)
            socket.emit('validation-error', error.message)
        }
    }
}
