import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    ballCount: number;
    startButton: Phaser.GameObjects.Text;
    inputFields: HTMLInputElement[] = [];
    pollInputField: HTMLInputElement;
    getPollButton: HTMLButtonElement;
    pollData: any;
    pollDataFetched: boolean = false;

    constructor ()
    {
        super('MainMenu');
        this.ballCount = 1;

    }
    fetchPollData() {
        const pollId = this.pollInputField.value;
        fetch(`https://plinko-bot-08e1622e0b2f.herokuapp.com/getPoll/${pollId}`)
            .then(response => response.json())
            .then(data => {
                this.pollData = data;
                this.pollDataFetched = true; // Set the flag to true after fetching data
                this.getPollButton.innerText = 'Start Game';
                this.getPollButton.removeEventListener('click', this.fetchPollData);
                this.getPollButton.addEventListener('click', () => this.startGame());
            })
            .catch(error => {
                console.error('Error fetching poll data:', error);
            });
    }
    createInputFieldForPollId() {
        this.pollInputField = document.createElement('input');
        this.pollInputField.type = 'text';
        this.pollInputField.placeholder = 'Enter Poll ID';
        // Styling
        this.pollInputField.style.position = 'absolute';
        this.pollInputField.style.top = '50%'; // Centers vertically
        this.pollInputField.style.left = '50%'; // Centers horizontally
        this.pollInputField.style.transform = 'translate(-50%, -50%)'; // Adjust the exact center
        this.pollInputField.style.fontFamily = '"Press Start 2P", cursive'; // Example retro font
        this.pollInputField.style.fontSize = '16px';
        this.pollInputField.style.padding = '10px';
        this.pollInputField.style.marginTop = '20px'; // To push it down from the title
        this.pollInputField.style.border = '1px solid black';
        this.pollInputField.style.borderRadius = '5px'; // Rounded corners
        this.pollInputField.style.outline = 'none'; // Removes the default focus outline
        this.pollInputField.style.boxShadow = '0 0 10px #000000'; // Soft shadow for depth
        this.pollInputField.style.background = 'rgba(255, 255, 255, 0.8)'; // Slightly transparent white
        this.pollInputField.style.color = '#000000'; // Text color

        // Adding hover effect
        this.pollInputField.addEventListener('mouseover', () => {
            this.pollInputField.style.background = 'rgba(255, 255, 255, 1)'; // Solid white on hover
        });
        this.pollInputField.addEventListener('mouseout', () => {
            this.pollInputField.style.background = 'rgba(255, 255, 255, 0.8)'; // Back to transparent white
        });

        // Add the input field to the document
        document.body.appendChild(this.pollInputField);
    }

    startGame() {
        // Transition to the Game scene, passing along the poll data
        this.scene.start('Game', this.pollData);

        // Check if the poll data has been fetched
        if (this.pollDataFetched) {
            // Remove the poll input field from the DOM
            if (this.pollInputField && this.pollInputField.parentElement) {
                this.pollInputField.parentElement.removeChild(this.pollInputField);
            }
            if (this.getPollButton && this.getPollButton.parentElement) {
                this.getPollButton.parentElement.removeChild(this.getPollButton);
            }

        } else {
            // If the poll data hasn't been fetched yet, don't start the game.
            console.error('Poll data has not been fetched. Game cannot start.');
        }
    }
    createGetPollButton() {
        const getPollButton = document.createElement('button');
        getPollButton.innerText = 'Click To Get Poll!';
        // Styling
        getPollButton.style = this.pollInputField.style.cssText; // Copy styles from the input field
        getPollButton.style.display = 'block';
        getPollButton.style.width = 'auto';
        getPollButton.style.height = 'auto';
        getPollButton.style.lineHeight = '20px';
        getPollButton.style.textAlign = 'center';
        getPollButton.style.cursor = 'pointer';
        getPollButton.style.marginTop = '90px'; // Adjust as needed

        // Hover effect
        getPollButton.addEventListener('mouseover', () => {
            getPollButton.style.background = 'rgba(0, 0, 0, 1)'; // Solid black on hover
            getPollButton.style.color = '#ffffff'; // White text on hover
        });
        getPollButton.addEventListener('mouseout', () => {
            getPollButton.style.background = 'rgba(255, 255, 255, 0.8)'; // Back to transparent white
            getPollButton.style.color = '#000000'; // Back to black text
        });

        // Click event
        getPollButton.addEventListener('click', () => this.fetchPollData());

        // Add the button to the document
        this.getPollButton = getPollButton; // Add this line to save the button reference
        document.body.appendChild(getPollButton);
    }

    create () {
        this.background = this.add.image(512, 384, 'main');
        // Add one input field by default
        const pathArray = window.location.pathname.split('/');
        const pollIdFromUrl  = pathArray[pathArray.length - 1]; // Assuming the poll ID is the last segment in the URL path

        // Check if the pollIdFromUrl is a number and populate the input field

        this.createInputFieldForPollId();
        this.createGetPollButton();

        if (pollIdFromUrl != undefined) {
            this.pollInputField.value = pollIdFromUrl;
            this.fetchPollData();
        }

    }

}
