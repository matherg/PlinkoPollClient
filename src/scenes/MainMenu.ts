import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    ballCount: number;
    startButton: Phaser.GameObjects.Text;
    addButton: Phaser.GameObjects.Text;
    inputFields: HTMLInputElement[] = [];

    constructor ()
    {
        super('MainMenu');
        this.ballCount = 1;

    }
    addBall() {
        this.createInputField(this.ballCount++);
    }
    startGame() {
        // Save the ball names into the game registry or pass them to the MainGame scene
        const ballNames = this.inputFields.map(input => input.value || `Ball ${input.placeholder}`);
        this.scene.start('Game', { ballNames });

        // Remove the input elements from the DOM
        this.inputFields.forEach(input => input.remove());
    }
    createInputField(index: number) {
        const yOffset = 300 + (index * 30);
        const input = document.createElement('input');
        input.type = 'text';
        input.style.position = 'absolute';
        input.style.top = `${yOffset}px`;
        input.style.left = '1000px';
        input.style.fontFamily = 'Arial Black';
        input.style.border = '1px solid black';
        document.body.appendChild(input);
        this.inputFields.push(input);
    }
    create ()
    {
        this.background = this.add.image(512, 384, 'main');
        this.add.text(800, 200, 'Add Options', { fontFamily: 'Arial Black', fontSize: 20, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center' })
        this.addButton = this.add.text(980, 255, '+', { fontFamily: 'Arial Black', fontSize: 30, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center' })
            .setInteractive()
            .on('pointerdown', () => this.addBall());

        this.startButton = this.add.text(346, 500, 'Start Game', { fontFamily: 'Arial Black', fontSize: 50, color: '#ffffff',
                stroke: '#000000', strokeThickness: 8,
                align: 'center' })
            .setInteractive()
            .on('pointerdown', () => this.startGame());

        // Add one input field by default
        this.createInputField(0);
    }
}
