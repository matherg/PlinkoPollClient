import { Scene } from 'phaser';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    balls: Phaser.GameObjects.Group;
    poles: Phaser.GameObjects.Group;
    zones: Phaser.GameObjects.Group;
    platforms: Phaser.GameObjects.Group;
    leaderboardText: Phaser.GameObjects.Text;
    leaderboardScores: string[];
    ballNames: string[];





    constructor ()
    {
        super('Game');
    }

    handleCollision (ball :  Phaser.GameObjects.GameObject, pole :  Phaser.GameObjects.GameObject) {
        if (!(ball instanceof Phaser.Physics.Arcade.Sprite) || !(pole instanceof Phaser.Physics.Arcade.Sprite)) {
            return;
        }
        if (!ball.body || !pole.body) return; // Guard clause to exit if body is null
        const impactAngle = Math.atan2(ball.body.velocity.y, ball.body.velocity.x);


        const rotationInfluence = ball.getData('rotationSpeed') * 5;

        // Apply the influence of rotation to the ball's velocity
        ball.body.velocity.x -= rotationInfluence * Math.sin(impactAngle);

        let newRotationSpeed = Math.cos(impactAngle)  + ball.getData('rotationSpeed');
        newRotationSpeed = Phaser.Math.Clamp(newRotationSpeed, -.5, .5);

        ball.setData('rotationSpeed', newRotationSpeed);

}


    updateLeaderboard() {

        const leaderboardString = 'Leaderboard\n' +this.leaderboardScores.join('\n');

        this.leaderboardText.setText(leaderboardString);
    }

    createStandardArea(startingY: number) {
        let ballNum = this.ballNames.length;
        const {width, height} = this.sys.game.canvas;
        let center = width/2;
        let tNum = ballNum + 3;
        for (var y = tNum; y >= 0; y--) {
            let startingPos = center - (tNum * 50)
            let offset = 0;
            let extra = 1;
            if (y % 2 == 0) {
                offset = 50
                extra = 0
            }
            for (var x = 0; x < tNum + extra; x++) {
                let pole = this.matter.add.sprite(startingPos + (x * 100) + offset, height /10 + ((tNum - y) * 100) + startingY, 'pole', undefined, {
                    isStatic: true,
                    shape: {
                        type: 'circle',
                        radius: 15
                    }
                });

                this.poles.add(pole)
            }
        }
    }
    createEnd(startingY: number) {
        const { width, height } = this.sys.game.canvas;

        // Define the dimensions and positions for the left and right platforms
        const platformLength = 400; // Length of each platform
        const platformThickness = 40; // Thickness of the platforms

        // Calculate positions
        const leftPlatformX = width / 2 + platformLength /1.4 ;
        const rightPlatformX = width / 2 - platformLength / 1.4 ;
        const platformY = startingY + height - 100; // Positioning it at the bottom

        // Left platform (\ part of the end)
          this.matter.add.rectangle(leftPlatformX, platformY, platformLength, platformThickness, {
            isStatic: true,
            angle: -Math.PI / 6, // Tilting to the left, -45 degrees in radians
        });

        // Right platform (/ part of the end)
         this.matter.add.rectangle(rightPlatformX, platformY, platformLength, platformThickness, {
            isStatic: true,
            angle: Math.PI / 6, // Tilting to the right, 45 degrees in radians
        });

        // If you need to set textures for these platforms, you would typically add separate Phaser.GameObjects.Sprite for visual representation
        // and not rely on the Matter.js render options due to the limitations in syncing visual and physics representations in Phaser 3
        this.add.image(leftPlatformX, platformY, 'end').setOrigin(0.5, 0.5).setAngle(-30).setScale(2, 4); // Assuming the texture 'end' fits a single platform and is 100x10 pixels
        this.add.image(rightPlatformX, platformY, 'end').setOrigin(0.5, 0.5).setAngle(30).setScale(2,4 );
    }

    createBalls(ballNames: string[], startX: number, startY: number) {
        ballNames.forEach((name, index) => {
            let positionX = startX + index * (Math.random() * 100 - 50); // Adjust spacing as needed
            let positionY = startY;

            // Create a ball with Matter physics
            let ball = this.matter.add.circle(positionX, positionY, 25, {
                restitution: 0.8,
                friction: 0.005,
                density: 0.01,

            });

            // To display the ball texture, consider creating a Phaser Sprite bound to the Matter body
            let ballSprite = this.add.sprite(positionX, positionY, 'ball');
            this.matter.add.gameObject(ballSprite, ball);

            // Assign custom data to the sprite for later use
            ballSprite.setData('name', name);

            // Track the ball sprites in a group
            this.balls.add(ballSprite);
        });
    }

    create (data: any)
    {
        this.matter.world.createDebugGraphic();

        this.camera = this.cameras.main;
        const worldHeight = 2000; // Example: making the world height much larger than the canvas height

        const {width, height} = this.sys.game.canvas;
        this.matter.world.setBounds(0,0,width, worldHeight, 25,true, true, false, true);

        this.background = this.add.image(512, 384, 'background').setScale(1, 10);

        // Set world bounds to be larger than the canvas size
        this.camera.setBounds(0, 0, width, worldHeight);

        // You may also want to set the camera to not go below the bottom of the canvas
        // This would be the game's canvas height minus the height of the camera's viewport

        this.camera.setDeadzone(0, height - this.cameras.main.height)
        this.leaderboardScores = [];
        this.leaderboardText =  this.add.text(50, 50, 'Leaderboard', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'left'
        }).setScrollFactor(0);
        this.ballNames = data.ballNames;
        this.camera.setBackgroundColor('#87CEFA');




       // let center = width/2;


        // Create zones, poles, and platforms groups as regular Phaser Groups
        this.zones = this.add.group();
        this.poles = this.add.group();
        this.platforms = this.add.group();

        // Now let's create the standard play area with poles as Matter bodies
        this.createStandardArea(0);

        // Create the end zone, also as a Matter body
        this.createEnd(0);

        //let zoneH = height-80
        //let zoneX = (width/2) - 300


        this.balls = this.add.group();
        this.createBalls(this.ballNames, width / 2, 0);

        //this.physics.world.createDebugGraphic();


        this.input.once('pointerdown', () => {

            this.scene.start('GameOver');

        });
    }
    update() {

    }
}
