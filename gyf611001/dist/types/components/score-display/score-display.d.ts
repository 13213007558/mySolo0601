export declare class ScoreDisplay {
    leftName: string;
    rightName: string;
    leftScore: number;
    rightScore: number;
    targetScore: number;
    period: number;
    timeRemaining: number;
    leftPriority: boolean;
    rightPriority: boolean;
    flashLeft: boolean;
    flashRight: boolean;
    cardLeftYellow: number;
    cardLeftRed: number;
    cardLeftBlack: boolean;
    cardRightYellow: number;
    cardRightRed: number;
    cardRightBlack: boolean;
    private prevLeft;
    private prevRight;
    componentWillLoad(): void;
    onLeftChange(newVal: number, oldVal: number): void;
    onRightChange(newVal: number, oldVal: number): void;
    triggerFlash(side: 'left' | 'right' | 'both'): Promise<void>;
    applyCard(side: 'left' | 'right', type: 'yellow' | 'red' | 'black'): Promise<void>;
    private formatTime;
    render(): any;
}
