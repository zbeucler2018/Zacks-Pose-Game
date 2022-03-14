// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// python3 -m http.server 
            // localhost:8000

// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/fTBi4VvcL/";

let model, webcam, ctx, labelContainer, maxPredictions, max, maxClass;
let GAME_STARTED = false;
let classes = ["Right arm out", "Neutral", "Left arm out", "Arms above"];
let score = 0; // the score of the game
let poseList = []; // a list of randomly selected poses
let poseIndex = 0;
let timer = 0; // keeps track of the duration of each turn
let NUMBER_OF_POSES; // sets the amount of poses per game
let TIME_BETWEEN_POSES; // sets the alloted time allowed per pose
let backg = "blue";
let GAME_ENDED = false;
let time_stamp;
let DELAY = 100; // delay for how long the background is green or red
let MODE_SELECTED = false; // has the user selected a mode?

// poses
let arms_up, left_arm_up, right_arm_up, neutral;

var submit_mode = () => {
    // this logic doesnt allow the game to start until the user has selected a game mode
    var select = document.getElementById('mode');
    var value = select.options[select.selectedIndex].value;
    if (value != "blank") {
        document.getElementById('start_btn').disabled = false; // allow user to pres start
        select.disabled = true; // disable select input
        MODE_SELECTED = value;
        document.getElementById('submit-btn').disabled = true; // disable submit btn

        // this is how I adjust the difficulties for each level
        if (MODE_SELECTED === "ez"){ 
            NUMBER_OF_POSES = 5;
            TIME_BETWEEN_POSES = 7;
        } else if (MODE_SELECTED === "med") {
            NUMBER_OF_POSES = 7;
            TIME_BETWEEN_POSES = 6;
        } else if (MODE_SELECTED) {
            NUMBER_OF_POSES = 10;
            TIME_BETWEEN_POSES = 4;
        }
        
        /**  Get a random list of poses for the player to do  **/
        for (var i = 1; i <= NUMBER_OF_POSES; i++){
            let randomPose = random(classes);
            poseList.push(randomPose);
        }
    }
}


async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // Note: the pose library adds a tmPose object to your window (window.tmPose)
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
    // Convenience function to setup a webcam
    const size = 400;
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(tf_loop);
    // append/get elements to the DOM
    const canvas = document.getElementById("canvas");
    canvas.width = size; canvas.height = size;
    ctx = canvas.getContext("2d");
    GAME_STARTED = true; // start the game
}
async function tf_loop(timestamp) {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(tf_loop);
}
async function predict() {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);
    max = 0;
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability.toFixed(2) > max){
            max = prediction[i].probability.toFixed(2);
            maxClass = prediction[i].className;
        }
    }
    // finally draw the poses
    drawPose(pose);
}
function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        // draw the keypoints and skeleton
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}



function preload() { // load all the stick figure poses
   arms_up = loadImage("imgs/arms_up.png");
   left_arm_up = loadImage("imgs/l_arm_up.png");
   right_arm_up = loadImage("imgs/r_arm_up.png");
   neutral = loadImage("imgs/neutral.png");
}
function setup() {
    var canvas = createCanvas(400, 400);
    canvas.parent('p5-div'); // attach the p5 canvas to a div
    textSize(30);
    fill("white");
}
function draw() {

    background(backg);
    let selectedPose = poseList[poseIndex]; // selected pose from the randomly created list
    
    if (GAME_STARTED === true) { // if the player has pressed the start button
        text("Score: "+score, 10, 70);

        if (frameCount === (time_stamp+DELAY)) { // turn the background color back to blue after it's been changed to red/green
            backg = "blue";
        }

        if (frameCount % 60 === 0){ // increase timer every second
            timer=timer+1;
        }

        text("Time Left: "+(TIME_BETWEEN_POSES-timer), 10, 25);

        if (selectedPose === "Right arm out"){ image(right_arm_up, 100, 170, 200, 200) }
        if (selectedPose === "Left arm out"){ image(left_arm_up, 100, 170, 200, 200) }
        if (selectedPose === "Neutral"){ image(neutral, 100, 170, 200, 200) }
        if (selectedPose === "Arms above"){ image(arms_up, 100, 170, 200, 200) }

        if (timer === TIME_BETWEEN_POSES) {
            time_stamp = frameCount; // get the frameCount when the user is being checked
            if (maxClass === selectedPose) {
                score = score+1;
                backg = "green";
            } else {
                backg = "red";
            }
            poseIndex = poseIndex+1; // move to the next pose
            timer = 0; // reset move timer
        }

        if (poseIndex === NUMBER_OF_POSES) { // the game has ended
            GAME_STARTED = false;
            GAME_ENDED = true;
        }
    }

    if (GAME_ENDED){
        backg = "blue";
        text("Game Over!", 100, 200);
        text("Final Score: "+score, 100, 250)
    }
}

function restart_game() {
    window.location.reload()
}









/*
1. user presses play game
2. 10 poses are randomly selected and contained in array poseList
3. global score variable is initalized to 0
4. for each pose in poseList
    5. show which pose should be performed
    6. wait 5 seconds
    7. if user is in that pose, score+1
    8. else, go to next pose
10. show score at end
*/