import { Scene } from 'phaser';
import CircleMaskImage from "phaser3-rex-plugins/plugins/gameobjects/canvas/circlemaskimage/CircleMaskImage";

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
    winZone: MatterJS.BodyType;
    raceOver: boolean;
    pollId : number





    constructor ()
    {
        super('Game');
    }
    preload () {
        this.load.plugin('rexcirclemaskimageplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexcirclemaskimageplugin.min.js', true);

    }



    createStandardArea(startingY: number) {
        const {width, height} = this.sys.game.canvas;
        let tNum = 5
       // let center = width/2;
        for (var y = tNum; y >= 0; y--) {
           // let startingPos = center - (tNum * 50)
            let offset = 0;
            let extra = 1;
            if (y % 2 == 0) {
                offset = 50
                extra = 0
            }
            for (var x = 0; x < tNum + 5 + extra; x++) {
                let pole = this.matter.add.sprite(15 + (x * 100) + offset, height /10 + ((tNum - y) * 100) + startingY, 'pole', undefined, {
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
        this.createWinZone();

        // Define the dimensions and positions for the left and right platforms
        const platformLength = 200 * 2.35; // Length of each platform
        const platformThickness = 40; // Thickness of the platforms

        // Calculate positions
        const leftPlatformX = width / 2 + platformLength /1.4 ;
        const rightPlatformX = width / 2 - platformLength / 1.4 ;
        const platformY = startingY + height - 80; // Positioning it at the bottom

        // Left platform (\ part of the end)
          this.matter.add.rectangle(leftPlatformX, platformY, platformLength, platformThickness, {
            isStatic: true,
            angle: -Math.PI / 12, // Tilting to the left, -45 degrees in radians
        });

        // Right platform (/ part of the end)
         this.matter.add.rectangle(rightPlatformX, platformY, platformLength, platformThickness, {
            isStatic: true,
            angle: Math.PI / 12, // Tilting to the right, 45 degrees in radians
        });

        // If you need to set textures for these platforms, you would typically add separate Phaser.GameObjects.Sprite for visual representation
        // and not rely on the Matter.js render options due to the limitations in syncing visual and physics representations in Phaser 3
        this.add.image(leftPlatformX, platformY, 'end').setOrigin(0.5, 0.5).setAngle(-15).setScale(1.35, 1); // Assuming the texture 'end' fits a single platform and is 100x10 pixels
        this.add.image(rightPlatformX, platformY, 'endL').setOrigin(0.5, 0.5).setAngle(15).setScale(1.35,1);
    }
    createWinZone() {
        const { width, height } = this.sys.game.canvas;
        const zoneHeight = 10; // Height for the win zone

        // Create an invisible sensor at the bottom of the screen
        this.winZone = this.matter.add.rectangle(width / 2, height - zoneHeight / 2, width, zoneHeight, {
            isSensor: true,
            isStatic: true
        });

        // Label the win zone for identification during collision events
        this.winZone.label = 'winZone';
    }
    createBall(avatarURL: string, vote: string, x: number, y: number, userName: string) {
        const textureKey = 'avatar_' + vote + '_' + Math.random().toString(16).slice(2);

        this.load.image(textureKey, avatarURL);

        this.load.once('complete', () => {
            // Once the texture is loaded, create the circle-masked image using the plugin
            let ballSprite = new CircleMaskImage(this, x, y, textureKey, undefined).setScale(.4)
            this.add.existing(ballSprite)

            // Set the physics body to a circle with a 25px radius
            let circleBody = this.matter.bodies.circle(x, y, 25, {
                restitution: 0.8,
                friction: 0.005,
                density: 0.01
            });
            circleBody.label = 'ball';
            // Add physics to the sprite
           this.matter.add.gameObject(ballSprite, circleBody);


            // Set the vote value as data on the sprite
            ballSprite.setData('vote', vote);
            ballSprite.setData('user',userName)

            // Add the ball to the balls group
            this.balls.add(ballSprite);

            console.log('Ball created with texture key:', textureKey);
        });



        this.load.start();
    }


    create (data: any)
    {
        this.pollId = data.pollId;
        this.matter.world.createDebugGraphic();
        this.raceOver = false;
        this.camera = this.cameras.main;
        const worldHeight = 2000;

        const {width, height} = this.sys.game.canvas;
        this.matter.world.setBounds(0,0,width, worldHeight, 25,true, true, false, true);

        this.background = this.add.image(512, 384, 'background');

        // Set world bounds to be larger than the canvas size
        this.camera.setBounds(0, 0, width, worldHeight);



        this.camera.setDeadzone(0, height - this.cameras.main.height)
        this.leaderboardScores = [];
        this.leaderboardText = this.add.text(50, 50, '', {
            fontFamily: '"Press Start 2P", cursive',
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#000000', // You might want to adjust this
            padding: { x: 10, y: 5 },
            align: 'left'
        }).setScrollFactor(0).setVisible(false);
        this.camera.setBackgroundColor('#87CEFA');







        // Create zones, poles, and platforms
        this.zones = this.add.group();
        this.poles = this.add.group();
        this.platforms = this.add.group();

        this.createStandardArea(0);
        this.createEnd(0);


        this.balls = this.add.group();
        console.log(data)
        if (data.votes) {
            Object.keys(data.votes).forEach((userID) => {
                const opt = data.votes[userID];
                const voter = data.voters.find((v: { userId: string; }) => v.userId === userID);
                if (voter) {
                    let ballX = (width/2) + (Math.random() * 1000) - 500
                    let pOpt = data.options[opt];
                    this.createBall(voter.avatarURL, pOpt, ballX, -10, voter.username);
                }
            });
        }

        this.input.once('pointerdown', () => {
            this.scene.start('GameOver');

        });
    }
    endPollRequest(pollId: number, username: string, option: string,) {
        console.log(username, option)
        fetch(`http://localhost:3000/endpoll/${pollId}/${username}/${option}`, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            }}
           )
    }
    updateLeaderboard(ball) {
        // Retrieve the ball's vote value
        console.log('Update Leaderboard');
        const vote = ball.getData('vote');
        const user = ball.getData('user');


        // Add the vote to the leaderboard scores array
        this.leaderboardScores.push(user + ": " +vote);

        // Sort or handle the leaderboard scores
        if (!this.leaderboardText.visible) {
            this.leaderboardText.setVisible(true).setDepth(100);
        }
        // Update the leaderboard text
        this.leaderboardText.setText('Winner\n' + this.leaderboardScores.join('\n'));
    }
    update() {
    // Check for collisions between the win zone and the balls
    this.matter.world.on('collisionstart', (event, bodyA, bodyB) => {
        if ((bodyA.label === 'ball' && bodyB.label === 'winZone') ||
            (bodyB.label === 'ball' && bodyA.label === 'winZone') && !this.raceOver) {
            let ball = bodyA.label === 'ball' ? bodyA.gameObject : bodyB.gameObject;
            this.raceOver = true;
            // Update the leaderboard with the ball's information
            this.updateLeaderboard(ball);
            const vote = ball.getData('vote');
            const user = ball.getData('user');
            this.endPollRequest(this.pollId, user, vote);

        }
    });
}
}
