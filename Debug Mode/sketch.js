// Debug mode
const DEBUG_MODE = true;

// Colour schemes
const BACKGROUND_COL = 0;
const TEXT_COL = 255;
const TITLE_ALPHA = 0;
const SUBTITLE_ALPHA = 0;

// Visual elements
const TEXT_GAP = 140;

// frequency needed to enter band and chance for loop to start, these are default values
const RANDOM_CHANCE = 500;
const LOWER_BAND = 12;
const LOW_BAND_CHANCE = RANDOM_CHANCE * 0.9;
const MIDDLE_BAND = 14;
const MID_BAND_CHANCE = RANDOM_CHANCE * 0.5;
const HIGHER_BAND = 16;

//polling rate for the arduino
const REFRESH_RATE = 200;

const OSCILLATOR_MAGIC_NUM = 4
 
const HIGH_BAND_CHANCE = RANDOM_CHANCE * 0.2;


//initialising elements
let mushyLoops = [];

let port;

let connectBtn, fadeDroneBtn, randomSampleBtn, sensSlider, audioCheck, lowInput, midInput, highInput, chanceValBtn, simulateCheck;

let currentMillis, previousMillis = 0;

let dataIn = false;
let sensorFreq, noiseX = 0;
let perlinX;

let droneOscs = [];
let droneVerb;

let pbRateTable = [0.5, 1, 2];

let samplefftTable, dronefftTable, reverbTable, delayTable, filterTable = [];

// variables to change with the project
//Number of loops in folder and their names
let mushyLoopsNum, mushyLoopNames;
let maxNameWidth = 0;


let midBandMult = 1.3;
let highBandMult = 1.5;

//Colour schemes
let sampleCols = [];

// Visual elements
let elemGap, waveSize, titleChoice; 
let titleTable = ['Musical Mycology', 'Fungal Frequencies', 'Groove Caps'];
let freqTable = [];
let greenAlpha, yellowAlpha, redAlpha = 0;


function preload() {
  // preloads all of the audio
  mushyLoopNames = loadStrings('mushyLoops/loopNames.txt', loadSamples);
  
}

function presetButton(name, position, mousePressEvent) {
    let button = createButton(name);
    button.position(position);
    if (mousePressEvent)
      button.mousePressed(mousePressEvent);
    if (!DEBUG_MODE)
      button.hide();

    return button;
}

function setup() {
  createCanvas(windowWidth - 150, windowHeight - 10);
  background(BACKGROUND_COL);

  titleChoice = floor(random(titleTable.length));

  // initiliasing serial data input
  port = createSerial();
  

  // allows previous ports to automatically start
  let usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) {
    port.open(usedPorts[0], 9600);
  }

  // presets all of the buttons in the project window for connecting and controlling sounds
  connectBtn=presetButton('Connect to Arduino', (windowWidth-70,0),connectBtnClick);
  fadeDroneBtn=presetButton('Fade Drone',(windowWidth-70,0),fadeDroneBtnClick);
  randomSampleBtn=presetButton('Add random sample',(windowWidth - 70, 100), randomSampleBtnClick);
  chanceValBtn=presetButton('Input new band multipliers', (30,35), chanceValBtnClick);

  // creates checkboxes
  audioCheck = createCheckbox('Toggle Audio', false);
  audioCheck.style('font-size', '40px');
  audioCheck.style('color', 'white');
  audioCheck.position(windowWidth * 0.70, 50);
  audioCheck.changed(toggleAudio);

  simulateCheck = createCheckbox('Simulate Sensor?', false);
  simulateCheck.style('color', 'white');
  simulateCheck.position(250, 60);

  // initiliases the inputs for the random chance values for each band
  lowInput = createInput(midBandMult);
  lowInput.position(30, 10);
  lowInput.size(20);

  midInput = createInput(highBandMult);
  midInput.position(60, 10);
  midInput.size(20);

  // initliases the slider controlling sensitivity of the bands
  sensSlider = createSlider(0, 40, 11);
  sensSlider.position(150, 60);
  sensSlider.style('width', '80px');

  droneVerb = new p5.Reverb();
  droneVerb.set(10, 1);
  droneVerb.drywet(1);

  //oscillator drones
  for (let i = 0; i < OSCILLATOR_MAGIC_NUM; i++) {
    droneOscs[i] = new p5.Oscillator('sine');
    droneOscs[i].freq(midiToFreq(34) * (i+1));
    droneOscs[i].disconnect();
    droneOscs[i].connect(droneVerb);
    droneOscs[i].start();
    droneOscs[i].amp(0);

    dronefftTable[i] = new p5.FFT();
    dronefftTable[i].setInput(droneOscs[i]);
    
  }

  for (let i = 0; i < mushyLoopsNum; i++) {
    colorMode(HSB);
    sampleCols[i] = color(360/mushyLoopsNum * i, 100, 100);
    colorMode(RGB);
  }

  elemGap = (height - TEXT_GAP)/(mushyLoopsNum + droneOscs.length);
  waveSize = elemGap/2;

  frameRate(REFRESH_RATE);
  
}


function draw() {
  background(BACKGROUND_COL);
  
  //Title
  fill(TEXT_COL);
  noStroke();

  push();
  fill(255, 255, 255, TITLE_ALPHA);
  textSize(22);
  textStyle(BOLDITALIC);
  textAlign(CENTER);
  text(titleTable[titleChoice], width/2, 50);
  TITLE_ALPHA++;

  fill(200, 200, 200, SUBTITLE_ALPHA);
  textStyle(ITALIC);
  textSize(18);
  rectMode(CENTER);
  text('A musical exhibition in collaboration with Diana Puntar and the students of Eltham College', width/2, 90, 500, 100);
  SUBTITLE_ALPHA += 0.5;
  pop();

  // takes slider value, adjusts bands and returns current value
  let sliderVal = sensSlider.value();

  LOWER_BAND = sliderVal;
  MIDDLE_BAND = sliderVal * midBandMult;
  HIGHER_BAND = sliderVal * highBandMult;

  textAlign(LEFT);
  textSize(12);
  textStyle(NORMAL);

  text('Sensitivity: ' + str(sliderVal), 30, 70);
  

  // calculates frequency and places it into bands, returning current frequency
  let inByte = port.lastByte();
  if (inByte == 1 && dataIn) {
    sensorFreq = calculateFreq();

    if (sensorFreq > LOWER_BAND && sensorFreq < MIDDLE_BAND) {
      lowBand();
    } else if (sensorFreq > MIDDLE_BAND && sensorFreq < HIGHER_BAND) {
      midBand();
    } else if (sensorFreq > HIGHER_BAND) {
      highBand();
    }
    
    

    // sensorFreq = 0;
    
  }

  text('Sensor Frequency: ' + str(sensorFreq), 30, 100)


  //waveforms of samples
  for (let i in samplefftTable) {
    
    fill(sampleCols[i]);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(11);
    text(mushyLoopNames[i] + ': ', 15, (i*elemGap) + TEXT_GAP);

    let waveForm = samplefftTable[i].waveform();

    noFill();
    beginShape();
    stroke(sampleCols[i]);

    for (let j = 0; j < waveForm.length; j++){
      let x = map(j, 0, waveForm.length, 100, width-20);
      let y = map(waveForm[j], -1, 1, (i*elemGap) + TEXT_GAP - waveSize, (i*elemGap) + TEXT_GAP + waveSize);
      vertex(x,y);
    }

    endShape();
  }

  //waveforms of drones
  for (let i in dronefftTable) {
    fill(TEXT_COL);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(11);
    text('drone ' + i + ': ', 15, ((int(i) + mushyLoopsNum) * elemGap) + TEXT_GAP);

    let newWaveform = dronefftTable[i].waveform();

    noFill();
    beginShape();
    stroke(255);

    for (let j = 0; j < newWaveform.length; j++){
      let x = map(j, 0, newWaveform.length, 100, width-20);
      let y = map(newWaveform[j], -1, 1, ((int(i) + mushyLoopsNum) * elemGap) + TEXT_GAP - waveSize, ((int(i) + mushyLoopsNum) * elemGap) + TEXT_GAP + waveSize) ;
      vertex(x,y);
    }

    endShape();
  }

  if (simulateCheck.checked() && dataIn) {
    sensorFreq = simulateSensor();
    if (sensorFreq > LOWER_BAND && sensorFreq < MIDDLE_BAND) {
      lowBand();
    } else if (sensorFreq > MIDDLE_BAND && sensorFreq < HIGHER_BAND) {
      midBand();
    } else if (sensorFreq > HIGHER_BAND) {
      highBand();
    }
  }

}






function mousePressed() {
  userStartAudio();
}





// BUTTON FUNCTIONS

function connectBtnClick() {
  if (!port.opened()) {
    port.open('Arduino', 9600);
  } else {
    port.close();
  }
}


function fadeDroneBtnClick() {
  if (droneOscs[0].getAmp() == 0) {
    for (let i in droneOscs) {
      if(i == 2) {
        droneOscs[i].amp(0.1, 5);
      }
      droneOscs[i].amp(0.05, 5);
    } 
  } else if (droneOscs[0].getAmp() > 0.01) {
    for (let i in droneOscs) {
      droneOscs[i].amp(0, 5);
    } 
  }
}

function randomSampleBtnClick() {
  let x = floor(random(mushyLoopsNum));
  if (mushyLoops[x].isPlaying() == false){
    let y = floor(random(3));
    let pbRate = pbRateTable[y];
    mushyLoops[x].play(0, pbRate);
  }
}

function toggleAudio() {
  if (audioCheck.checked()) {
    userStartAudio();
    port.open('Arduino', 9600);
    dataIn = true;
  } else {
    dataIn = false;
  }
  fadeDroneBtnClick();
  
}

function chanceValBtnClick() {
  // LOW_BAND_CHANCE = float(lowInput.value()) * RANDOM_CHANCE;
  // MID_BAND_CHANCE = float(midInput.value()) * RANDOM_CHANCE;
  // HIGH_BAND_CHANCE = float(highInput.value()) * RANDOM_CHANCE;

  midBandMult = float(lowInput.value()) * RANDOM_CHANCE;
  highBandMult = float(midInput.value()) * RANDOM_CHANCE;
  

  console.log(LOW_BAND_CHANCE);
  console.log(MID_BAND_CHANCE);
  console.log(HIGH_BAND_CHANCE);
}



// EXTRA FUNCTIONS


function loadSamples() {
  mushyLoopsNum = mushyLoopNames.length;

  for (let i = 0; i < mushyLoopsNum; i++) {
    mushyLoops[i] = loadSound('mushyLoops/' + mushyLoopNames[i] + '.wav');
    mushyLoops[i].setVolume(1);
    mushyLoops[i].disconnect()

    samplefftTable[i] = new p5.FFT();
    samplefftTable[i].setInput(mushyLoops[i]);

    reverbTable[i] = new p5.Reverb();
    // reverbTable[i].process(mushyLoops[i], 3, 2);
    reverbTable[i].set(3, 2);
    reverbTable[i].amp(1);
    reverbTable[i].drywet(1);

    delayTable[i] = new p5.Delay();
    // delayTable[i].process(mushyLoops[i], 0.5, 0.5, 2300);
    delayTable[i].delayTime(0.5);
    delayTable[i].feedback(0.5);
    delayTable[i].drywet(1);
    delayTable[i].amp(1);
    delayTable[i].disconnect()

    // distTable[i] = new p5.Distortion();
    // distTable[i].process(mushyLoops[i], [amount=0.03]);
    // distTable[i].set([amount=0.03]);
    // distTable[i].drywet(1);
    // distTable[i].amp(1);
    // distTable[i].disconnect();

    filterTable[i] = new p5.HighPass();
    // filterTable[i].process(mushyLoops[i], 2000);
    filterTable[i].freq(1000);
    filterTable[i].drywet(1);
    filterTable[i].amp(1);
    filterTable[i].disconnect();

    mushyLoops[i].connect(filterTable[i]);
    filterTable[i].connect(delayTable[i]);
    delayTable[i].connect(reverbTable[i]);

  }
}





function calculateFreq() {
  //calculates the frequency of the timer
  currentMillis = millis();
  let timePeriod = (currentMillis - previousMillis) / 1000;
  mushFreq = 1 / float(timePeriod);
  
  previousMillis = currentMillis;

  return mushFreq;
}





function lowBand() {
  let chanceOfLoop = random(RANDOM_CHANCE);
  
  if (chanceOfLoop > LOW_BAND_CHANCE) {
    let loopNum = floor(random(mushyLoopsNum));
    if (mushyLoops[loopNum].isPlaying() == false){
      let randAmp = random(0.1,0.3);
      let reverbChance = round(random(2));
      let randRev = round(random());
      
      mushyLoops[loopNum].play(0, 0.5, randAmp);
      reverbTable[loopNum].set(3,2,randRev);
      reverbTable[loopNum].drywet(reverbChance / 2);
      delayTable[loopNum].drywet(0);
      // distTable[loopNum].drywet(0);
      filterTable[loopNum].drywet(0);
    }
  }
  
}

function midBand() {
  let chanceOfLoop = random(RANDOM_CHANCE);
  
  if (chanceOfLoop > MID_BAND_CHANCE) {
    let loopNum = floor(random(mushyLoopsNum));
    if (mushyLoops[loopNum].isPlaying() == false){
      let randAmp = random(0.3, 0.6);
      let delChance = round(random(2));
      let randRev = round(random());
      
      mushyLoops[loopNum].play(0, 1, randAmp);
      delayTable[loopNum].drywet(delChance / 2);
      reverbTable[loopNum].drywet(delChance / 2);
      reverbTable[loopNum].set(3,2,randRev);
      // distTable[loopNum].drywet(0);
      filterTable[loopNum].drywet(0);
    }
  }
}

function highBand() {
  let chanceOfLoop = random(RANDOM_CHANCE);
  
  if (chanceOfLoop > HIGH_BAND_CHANCE) {
    let loopNum = floor(random(mushyLoopsNum));
    if (mushyLoops[loopNum].isPlaying() == false){
      let randAmp = random(0.6, 1);
      let distChance = round(random());
      let randRev = round(random());
      
      mushyLoops[loopNum].play(0, 2, randAmp);
      // distTable[loopNum].drywet(randAmp * distChance);
      filterTable[loopNum].drywet(distChance);
      delayTable[loopNum].drywet(distChance);
      reverbTable[loopNum].drywet(distChance);
      reverbTable[loopNum].set(3,2,randRev);
    }
  }
}



function simulateSensor() {
  perlinX = noise(noiseX);
  noiseX++;
  return(map(perlinX,0,1,8,18));
}