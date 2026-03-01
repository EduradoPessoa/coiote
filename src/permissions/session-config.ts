export type AutonomyMode = 'ask-all' | 'ask-destructive' | 'auto';

export interface SessionConfig {
    mode: AutonomyMode;
    autoCommit?: boolean;
}

export const defaultSessionConfig: SessionConfig = {
    mode: 'ask-all',
    autoCommit: false,
};
