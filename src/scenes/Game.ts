import { Scene } from 'phaser';
import CircleMaskImage from "phaser3-rex-plugins/plugins/gameobjects/canvas/circlemaskimage/CircleMaskImage";

export class Game extends Scene {
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
    pollId: number
    restartButton: Phaser.GameObjects.Text;
    endPollSent: boolean;
    private recorder: MediaRecorder;
    private recordedChunks: any[];


    constructor() {
        super('Game');
    }

    preload() {
        this.load.plugin('rexcirclemaskimageplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexcirclemaskimageplugin.min.js', true);

    }


    positionPoles() {
        const {width, height} = this.sys.game.canvas;
        const poleRadius = 15;
        const ballDiameter = 50;

        // Calculate rows of pole positions
        const rowsOfPoles = this.positionPolesVertically(width, height, poleRadius, ballDiameter);

        rowsOfPoles.forEach(row => {
            row.poles.forEach(xPosition => {
                let pole = this.matter.add.sprite(xPosition, row.y, 'pole', undefined, {
                    isStatic: true,
                    shape: {
                        type: 'circle',
                        radius: poleRadius
                    }
                });

                this.poles.add(pole);
            });
        });
    }

    positionPolesVertically(screenWidth: number, screenHeight: number, poleRadius: number, ballDiameter: number) {
        const verticalSpacing = ballDiameter * 2;
        const numberOfRows = Math.floor((screenHeight - 100) / verticalSpacing);
        const rowsOfPoles = [];

        for (let row = 0; row < numberOfRows; row++) {
            let staggerOffset = row % 2 !== 0;
            let horizontalPositions = this.positionPolesHorizontally(screenWidth, poleRadius, ballDiameter, staggerOffset);
            let verticalPosition = row * verticalSpacing + verticalSpacing / 2;

            rowsOfPoles.push({
                y: verticalPosition,
                poles: horizontalPositions
            });
        }

        return rowsOfPoles;
    }

    positionPolesHorizontally(screenWidth: number, poleRadius: number, ballDiameter: number, staggerOffset: boolean) {
        const unitSpace = 2 * poleRadius + ballDiameter + 10; // Space taken by one pole and one ball diameter
        let numberOfPoles = Math.floor((screenWidth  ) / unitSpace);
        if (staggerOffset ) {
            numberOfPoles -= 1;
        }
        let remainingSpace = screenWidth - (numberOfPoles * unitSpace) ;
        let edgeSpace = remainingSpace / 2 ;
        const polePositions = [];

        let currentPosition = edgeSpace + ballDiameter / 2 + poleRadius;
        if (staggerOffset ) {
            polePositions.push(-1);
            currentPosition += unitSpace/2;
        }
        for (let i = 0; i < numberOfPoles; i++) {
            polePositions.push(currentPosition);
            currentPosition += unitSpace;
        }
        if (staggerOffset) {
            polePositions.push(screenWidth +1)
        }
        return polePositions;
    }

    createEnd(startingY: number) {
        const {width, height} = this.sys.game.canvas;
        this.createWinZone();

        const platformLength = 200 * 2.35;
        const platformThickness = 40;

        // Calculate positions
        const leftPlatformX = width / 2 + platformLength / 1.4;
        const rightPlatformX = width / 2 - platformLength / 1.4;
        const platformY = startingY + height - 80;

        // Left platform
        this.matter.add.rectangle(leftPlatformX, platformY, platformLength, platformThickness, {
            isStatic: true,
            angle: -Math.PI / 12,
        });

        // Right platform
        this.matter.add.rectangle(rightPlatformX, platformY, platformLength, platformThickness, {
            isStatic: true,
            angle: Math.PI / 12,
        });

        this.add.image(leftPlatformX, platformY, 'end').setOrigin(0.5, 0.5).setAngle(-15).setScale(1.35, 1); // Assuming the texture 'end' fits a single platform and is 100x10 pixels
        this.add.image(rightPlatformX, platformY, 'endL').setOrigin(0.5, 0.5).setAngle(15).setScale(1.35, 1);
    }

    createWinZone() {
        const {width, height} = this.sys.game.canvas;
        const zoneHeight = 10; // Height for the win zone

        this.winZone = this.matter.add.rectangle(width / 2, height - zoneHeight / 2, width, zoneHeight, {
            isSensor: true,
            isStatic: true
        });

        this.winZone.label = 'winZone';
    }

    createBall(avatarURL: string, vote: string, x: number, y: number, userName: string, userID: string) {
        const textureKey = 'avatar_' + vote + '_' + Math.random().toString(16).slice(2);

        this.load.image(textureKey, avatarURL);

        this.load.once('complete', () => {
            let ballSprite = new CircleMaskImage(this, 3, y, textureKey, undefined, 2).setScale(.4);
            this.add.existing(ballSprite)

            let circleBody = this.matter.bodies.circle(x, y, 25, {
                restitution: .66,
                friction: 0,
                density: 0.01
            });
            circleBody.label = 'ball';
            // Add physics to the sprite
            this.matter.add.gameObject(ballSprite, circleBody);


            // Set the vote value as data on the sprite
            ballSprite.setData('vote', vote);
            ballSprite.setData('user', userName)
            ballSprite.setData('userId', userID);

            // Add the ball to the balls group
            this.balls.add(ballSprite);

            console.log('Ball created with texture key:', textureKey);
        });


        this.load.start();
    }


    create(data: any) {
        this.restartButton = this.add.text(50, 150, 'Restart', {
            fontFamily: '"Press Start 2P", cursive',
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: {x: 10, y: 10},
            align: 'left'
        })
            .setInteractive().setDepth(100)
            .setVisible(false)
            .on('pointerdown', () => this.restartGame());
        this.pollId = data.pollId;
        this.raceOver = false;
        this.camera = this.cameras.main;
        const worldHeight = 2000;

        const {width, height} = this.sys.game.canvas;
        this.matter.world.setBounds(0, 0, width, worldHeight, 25, true, true, false, true);

        this.background = this.add.image(512, 384, 'background');

        // Set world bounds to be larger than the canvas size
        this.camera.setBounds(0, 0, width, worldHeight);


        this.camera.setDeadzone(0, height - this.cameras.main.height)
        this.leaderboardScores = [];
        this.leaderboardText = this.add.text(50, 50, '', {
            fontFamily: '"Press Start 2P", cursive',
            fontSize: '20px',
            color: '#ffffff',
            lineSpacing: 10,
            backgroundColor: '#000000', // You might want to adjust this
            padding: {x: 10, y: 10},
            align: 'left'
        }).setScrollFactor(0).setVisible(false);
        this.camera.setBackgroundColor('#87CEFA');

        // Create zones, poles, and platforms
        this.zones = this.add.group();
        this.poles = this.add.group();
        this.platforms = this.add.group();

        this.positionPoles();
        this.createEnd(0);


        this.balls = this.add.group();
        if (data.votes) {
            Object.keys(data.votes).forEach((userID) => {
                const opt = data.votes[userID];
                const voter = data.voters.find((v: { userId: string; }) => v.userId === userID);
                if (voter) {
                    let ballX = (width / 2) + (Math.random() * 800) - 400
                    let pOpt = data.options[opt];
                    this.createBall(voter.avatarURL, pOpt, ballX, -20, voter.username, userID);
                }
            });
        }
        this.startRecording()
    }

    endPollRequest(pollId: number, userId: string, option: string, optionNum: number, blob: Blob) {
        const formData = new FormData();
        formData.append('pollId', pollId.toString());
        formData.append('userId', userId);
        formData.append('option', option);
        formData.append('optionNum', optionNum.toString())
        formData.append('replay', blob, 'replay.webm');
            fetch(`https://plinko-bot-08e1622e0b2f.herokuapp.com/endpoll`, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            })
                .then(response => response.json())
                .then(data => console.log(data))
                .catch(error => console.error('Error:', error));
    }

    startRecording() {
        const canvasStream = this.game.canvas.captureStream(30); // 30 FPS
        this.recorder = new MediaRecorder(canvasStream, {mimeType: 'video/webm'});

        this.recordedChunks = [];
        this.recorder.ondataavailable = event => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };
        this.recorder.start();

    }

    stopRecording() {
        return new Promise(resolve => {
            this.recorder.onstop = async () => {
                const blob = new Blob(this.recordedChunks, {type: 'video/webm'});
                resolve(blob);
            };

            this.recorder.stop();
        });
    }


    updateLeaderboard(ball) {
        // Retrieve the ball's vote value
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
    restartGame() {
        this.scene.restart();
    }
    update() {
    // Check for collisions between the win zone and the balls
    this.matter.world.on('collisionstart', (event, bodyA, bodyB) => {
        if ((bodyA.label === 'ball' && bodyB.label === 'winZone') ||
            (bodyB.label === 'ball' && bodyA.label === 'winZone') && !this.raceOver) {
            let ball = bodyA.label === 'ball' ? bodyA.gameObject : bodyB.gameObject;
            this.raceOver = true;
            this.updateLeaderboard(ball);
            const vote = ball.getData('vote');
            const userId = ball.getData('userId');
            this.stopRecording().then(blob => {
            if (!this.endPollSent) {
                this.endPollRequest(this.pollId, userId, vote, this.balls.getLength(), blob);
                this.endPollSent = true;
            }});
            this.restartButton.setVisible(true);
        }
    });
    }
}
