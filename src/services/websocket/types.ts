import type { Mensaje } from '../../types/api';

export type MessageHandler = (message: Mensaje) => void;
export type TypingHandler = (userId: number) => void;
export type ReadHandler = (userId: number) => void;