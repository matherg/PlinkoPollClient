import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image('background', 'assets/background.png');
        this.load.image('main', 'assets/main.png');
        this.load.image('end', 'assets/end.png');
        this.load.image('endL', 'assets/endL.png');

        this.load.image('pole', 'assets/pole.png');
        this.load.image('ball', 'assets/ball.png');
        this.load.image('1', 'assets/1.png');
        this.load.image('2', 'assets/2.png');
        this.load.image('3', 'assets/3.png');
        this.load.image('4', 'assets/4.png');

    }

    create ()
    {
        this.scene.start('Preloader');
    }
}
