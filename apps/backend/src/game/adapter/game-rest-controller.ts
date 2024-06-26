import { FastifyReply, FastifyRequest } from 'fastify'
import { autoInjectable, inject } from 'tsyringe'
import { CreateRoomUseCase } from '../usecases/create-room-usecase'

@autoInjectable()
export class GameRestController {
    constructor(
        @inject(CreateRoomUseCase)
        private createRoomUseCase: CreateRoomUseCase,
    ) {}

    public async createRoom(request: FastifyRequest, reply: FastifyReply) {
        console.log('Creating room', request.ip)
        const { gameId } = await this.createRoomUseCase.execute()
        reply.send({ gameId, gameUrl: `${process.env.FRONTEND_URL}?gameId=${gameId}` })
    }
}
