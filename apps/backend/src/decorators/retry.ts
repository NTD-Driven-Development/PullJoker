/* eslint-disable @typescript-eslint/no-explicit-any */
export const Retry = (target: any, propertyKey: string, descriptor: any) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
        try {
            return await originalMethod.apply(this, args)
        } catch (error: any) {
            if (error.message.includes('aggregate_id_version')) {
                console.log('retrying')
                return await originalMethod.apply(this, args)
            }
            throw error
        }
    }
}
