/** @jsx jsx */
import { jsx } from '@emotion/react'
import useEventListener from '@use-it/event-listener'
import { useInterval } from '../../utils/useInterval'
import { useReducer, useEffect, useCallback, useState } from 'react'
import { SOCKET } from '../../config/constants.json'
import { 
    cancelSubscribtionToEvent,
    emitToEvent,
    emitToEventWithAcknowledgement,
    emitToEventWithAcknowledgementPromise,
    subscribeToEvent
} from '../../middlewares/socket'
import { 
    movePiece,
    movePieceToLowerPlace, 
    checkPosition,
    addPieceToTheGrid, 
    rotatePiece,
    convertStructureToPositions,
    checkGameOver,
    clearFullLineGrid,
    addPenaltyToGrid,
    getGridSpectrum
} from '../../utils/gameFunctions'
import { NextPiece } from './NextPiece'
import { Line } from './Line'

const initialGrid: Grid = [
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
    
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
    
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
    ]


function Grid({ speed, mode }: { speed: GameSpeed, mode: GameMode }) {
    const [isKo, setIsKo] = useState(false)
    const [piece, setPiece] = useState<Piece>()
    const [nextPiece, setNextPiece] = useState<Piece>()
    const [grid, setGrid] = useState(initialGrid)

    const handleKey = (key: string) => {
        if (!piece || !key || isKo) return

        if (key === "ArrowRight") {
            const updatedPiece = movePiece(piece, 1, 0)
            if (checkPosition(updatedPiece.positions, grid))
                setPiece(updatedPiece)
        }
        else if (key === "ArrowLeft") {
            const updatedPiece = movePiece(piece, -1, 0)
            if (checkPosition(updatedPiece.positions, grid))
                setPiece(updatedPiece)
        }
        // Rotation
        else if (key === "ArrowUp") {
            const updatedStructure = rotatePiece(piece.structure)
            const updatedPositions = convertStructureToPositions(updatedStructure, piece.leftTopPosition)
            if (checkPosition(updatedPositions, grid)) {
                const updatedPiece = {
                    ...piece,
                    positions: updatedPositions,
                    structure: updatedStructure
                }
                setPiece(updatedPiece)
            }
        }
        else if (key === "ArrowDown") {
            const updatedPiece = movePiece(piece, 0, 1)
            if (checkPosition(updatedPiece.positions, grid))
                setPiece(updatedPiece)
            else {
                const updatedGrid = addPieceToTheGrid(piece, grid)
                const { newGrid, lineRemoved } = clearFullLineGrid(updatedGrid)
                emitToEvent(SOCKET.GAMES.LINE, lineRemoved)
                setPiece(nextPiece)
                emitToEventWithAcknowledgement(SOCKET.GAMES.GET_PIECE, null, (error, nextPiece: Piece) => {
                    if (!error)
                        setNextPiece(nextPiece)
                })
                setGrid(newGrid)
            }
        }
        // Space bar
        else if (key === " ") {
            const updatedPiece = movePieceToLowerPlace(piece, grid)
            const updatedGrid = addPieceToTheGrid(updatedPiece, grid)
            const { newGrid, lineRemoved } = clearFullLineGrid(updatedGrid)
            emitToEvent(SOCKET.GAMES.LINE, lineRemoved)
            setPiece(nextPiece)
            emitToEventWithAcknowledgement(SOCKET.GAMES.GET_PIECE, null, (error, nextPiece: Piece) => {
                if (!error)
                    setNextPiece(nextPiece)
            })
            setGrid(newGrid)
        }
    }

    useEffect(() => {
        emitToEventWithAcknowledgement(SOCKET.GAMES.GET_PIECE, {}, (error, piece: Piece) => {
            if (piece) 
                setPiece(piece)
        })

        emitToEventWithAcknowledgement(SOCKET.GAMES.GET_PIECE, {}, (error, piece: Piece) => {
            if (piece) 
                setNextPiece(piece)
        })

        // Subscribe to line penalty sended by the players
        subscribeToEvent(SOCKET.GAMES.LINE_PENALTY, (error, linesCount: number) => {
            setGrid(grid => addPenaltyToGrid(grid, linesCount))
        })

        return () => {
            cancelSubscribtionToEvent(SOCKET.GAMES.LINE_PENALTY)
        }
    }, [])

    // // Check game Over
    // // Send new grid spectrum
    useEffect(() => {
        if (checkGameOver(grid)) {
            emitToEvent(SOCKET.GAMES.GAME_OVER)
            setIsKo(true)
        }
        const spectrum = getGridSpectrum(grid)
        emitToEvent(SOCKET.GAMES.SPECTRUM, spectrum)
    }, [grid])

    useEventListener('keydown', ({ key }: { key: string }) => handleKey(key))

    return (
        <div
            id="grid_container"
            css={{
                gridArea: 'main_grid',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                margin: '10px 0px',
                filter: isKo ? 'brightness(0.5)' : 'brightness(1)',
                transition: 'filter 500ms'
            }}
        >
            <div 
                css={(theme: any) => ({
                    width: '300px',
                    height: '600px',
                    display: 'grid',
                    gridTemplateRows: 'repeat(20, minmax(0, 1fr))',
                    gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
                    border: `15px solid ${theme.colors.text2}`,
                    clipPath: `polygon(15px 0px, 100% 0%, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0% calc(100% - 15px), 0% 100%, 0px 15px)`
                })}
            >
                {piece && grid.map((line, index) => (
                    <Line
                        key={`line_${index}`} 
                        invisible={mode === 'invisible'}
                        piecePositions={isKo ? null : piece.positions}
                        pieceType={piece.type}
                        cells={line}
                        yCoord={index}
                    />
                ))}
                {isKo && (
                    <div
                        css={{
                            background: 'black',
                            color: 'white',
                            position: 'absolute',
                            top: '255px',
                            zIndex: 2,
                            width: '300px',
                            height: '120px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexDirection: 'column'
                        }}
                    >
                        <p>KO</p>
                        <p>Wait for other players to end</p>
                    </div>
                )}
            </div>
            {nextPiece &&
                <NextPiece pieceType={nextPiece.type} />
            }
        </div>
    )
}

export default Grid