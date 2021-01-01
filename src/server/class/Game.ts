import _ from 'lodash'
import { Player } from './Player'
import { Piece } from './Piece'
import { gameModeType, GameParameters, gameStatusType } from './types'

// TO BE DONE
// FOR Now 100 piece are created at the beginning but need to create more if needed


class Game {
    players: Player[];
    pieces: Piece[];
    leaderId: string;
    name: string;
    status: gameStatusType = 'idle';
    mode: gameModeType = 'classic';
    maxPlayers: number = 2;
    speed: number = 1;
    winner: string = '';

    constructor(gameParameters: GameParameters, player: Player) {
        this.name = gameParameters.name
        this.players = [player]
        this.leaderId = player.id
        this.pieces = Piece.generatingPiecesPool()
        Object.assign(this, gameParameters)
    }

    addPlayer(player: Player) {
        this.players.push(player)
    }

    removePlayer(playerId: string) {
        const index = _.findIndex(this.players, { id: playerId })
        this.players.splice(index, 1)
    }

    transferLeadership() {
        this.leaderId = this.players[0].id
    }

    changeStatus(status: gameStatusType) {
        this.status = status
    }

    changeGameParameters(gameParameters: GameParameters) {
        Object.assign(this, gameParameters)
    }

    isLeader(playerId: string) {
        return this.leaderId === playerId
    }

    getPlayer(playerId: string): Player | null {
        const player = _.find(this.players, { id: playerId }) || null
        return player
    }


    setPlayerKo(playerId: string) {
        const player = this.getPlayer(playerId)
        if (!player)
            return
        // if the player is solo in the game
        if (this.players.length === 1) {
            this.status = 'ended'
            this.winner = player.username
        }
        else {
            player.setStatus('KO')
            const playersStillPlaying = _.filter(this.players, { status: 'playing' })
            if (playersStillPlaying.length === 1) {
                this.status = 'ended'
                this.winner = playersStillPlaying[0].username
            }
        }
    }

    givePiece(playerId: string) {
        const player = this.getPlayer(playerId)
        if (player) {
            const currentPieceIndex = player.currentPieceIndex
            player.incrementCurrentPieceIndex()
            return this.pieces[currentPieceIndex]
        }
        else 
            return null
    }

    updateSpectrum(spectrumArray: number[], playerId: string) {
        const player = this.getPlayer(playerId)
        if (player)
            player.setSpectrum(spectrumArray)
    }

    info() {
        return {
            name: this.name,
            players: this.players.map((player) => player),
            maxPlayers: this.maxPlayers,
            // mode: this.mode,
            // speed: this.speed,
            status: this.status,
            leaderId: this.leaderId,
            winner: this.winner
        }
    }

    reset() {
        this.pieces = Piece.generatingPiecesPool()
        this.winner = ''
        this.players.forEach((player) => player.reset())
    }
}


export { Game }