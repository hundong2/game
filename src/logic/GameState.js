export class GameState {
    constructor() {
        this.currentStage = 1;
        this.loopCount = 1;
    }

    nextStage() {
        if (this.currentStage >= 20) {
            this.currentStage = 1;
            this.loopCount++;
        } else {
            this.currentStage++;
        }
    }

    getEffectiveLevel() {
        return this.currentStage + (this.loopCount - 1) * 20;
    }
}
