//initialising elements
let mushyLoops = [];

let port;

const connectBtn;
const fadeDroneBtn;
const randomSampleBtn;
const sensSlider;
const audioCheck;
const lowInput;
const midInput;
const highInput;
const chanceValBtn;
const simulateCheck;

let currentMillis = 0;
let previousMillis = 0;

let sensorFreq = 0;
let dataIn = false;
let noiseX = 0;
let perlinX;

let droneOscs = [];
let droneVerb;

let pbRateTable = [0.5, 1, 2];

let samplefftTable = [];
let dronefftTable = [];
let reverbTable = [];
let delayTable = [];
// let distTable = [];
let filterTable = [];

// variables to change with the project
//Number of loops in folder and their names
let mushyLoopsNum;
let mushyLoopNames;
let maxNameWidth = 0;

//polling rate for the arduino
let refreshRate = 200;
 
// frequency needed to enter band and chance for loop to start, these are default values
let randomChance = 500;
let lowerBand = 12;
let lowBandChance = randomChance * 0.9;
let middleBand = 14;
let midBandChance = randomChance * 0.5;
let higherBand = 16;
let highBandChance = randomChance * 0.2;

let midBandMult = 1.3;
let highBandMult = 1.5;

//Colour schemes
let backgroundCol = 0;
let textCol = 255;
let titleAlpha = 0;
let subtitleAlpha = 0;
let sampleCols = [];

// Visual elements

let textGap = 140;
let elemGap;
let waveSize;
let titleTable = ['Musical Mycology', 'Fungal Frequencies', 'Groove Caps'];
let titleChoice; 
let freqTable = [];
let greenAlpha = 0;
let yellowAlpha = 0;
let redAlpha = 0;





function preload() {
  // preloads all of the audio

  mushyLoopNames = loadStrings('mushyLoops/loopNames.txt', loadSamples);
  
}




function setup() {
  createCanvas(windowWidth, windowHeight);
  background(backgroundCol);

  titleChoice = floor(random(titleTable.length));

  // initiliasing serial data input
  port = createSerial();
  

  // allows previous ports to automatically start
  let usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) {
    port.open(usedPorts[0], 9600);
  }

  // presets all of the buttons in the project window for connecting and controlling sounds

  connectBtn = createButton('Connect to Arduino');
  connectBtn.position(windowWidth - 70, 0);
  connectBtn.mousePressed(connectBtnClick);
  connectBtn.hide();

  fadeDroneBtn = createButton('Fade Drone');
  fadeDroneBtn.position(windowWidth - 70, 200);
  fadeDroneBtn.mousePressed(fadeDroneBtnClick);
  fadeDroneBtn.hide();

  randomSampleBtn = createButton('Add random sample');
  randomSampleBtn.position(windowWidth - 70, 100);
  randomSampleBtn.mousePressed(randomSampleBtnClick);
  randomSampleBtn.hide();

  audioCheck = createCheckbox('Toggle Audio', false);
  audioCheck.style('font-size', '40px');
  audioCheck.style('color', 'white');
  audioCheck.position(windowWidth * 0.8, 50);
  audioCheck.changed(toggleAudio);
  

  chanceValBtn = createButton('Input new band multipliers');
  chanceValBtn.position(30, 35);
  chanceValBtn.mousePressed(chanceValBtnClick);
  chanceValBtn.hide();

  simulateCheck = createCheckbox('Simulate Sensor?', false);
  simulateCheck.style('color', 'white');
  simulateCheck.position(250, 60);
  simulateCheck.hide();

  // initiliases the inputs for the random chance values for each band

  lowInput = createInput(midBandMult);
  lowInput.position(30, 10);
  lowInput.size(20);
  lowInput.hide();

  midInput = createInput(highBandMult);
  midInput.position(60, 10);
  midInput.size(20);
  midInput.hide();

  // highInput = createInput('0.2');
  // highInput.position(90, 10);
  // highInput.size(20);

  // initliases the slider controlling sensitivity of the bands

  sensSlider = createSlider(0, 40, 11);
  sensSlider.position(150, 50);
  sensSlider.style('width', '80px');
  

  droneVerb = new p5.Reverb();
  droneVerb.set(10, 1);
  droneVerb.drywet(1);

  //oscillator drones
  for (let i = 0; i < 4; i++) {
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

  elemGap = (height - textGap)/(mushyLoopsNum + droneOscs.length);
  waveSize = elemGap/2;

  for (let i = 0; i < 80; i++) {
    freqTable[i] = 0;
  }

  frameRate(refreshRate);

  
}





function draw() {
  background(backgroundCol);
  
  //Title
  fill(textCol);
  noStroke();

  push();
  fill(255, 255, 255, titleAlpha);
  textSize(22);
  textStyle(BOLDITALIC);
  textAlign(CENTER);
  text(titleTable[titleChoice], width/2, 50);
  titleAlpha++;

  fill(200, 200, 200, subtitleAlpha);
  textStyle(ITALIC);
  textSize(18);
  rectMode(CENTER);
  text('A musical exhibition in collaboration with Diana Puntar and the students of Eltham College', width/2, 90, 500, 100);
  subtitleAlpha += 0.5;
  pop();

  // takes slider value, adjusts bands and returns current value
  let sliderVal = sensSlider.value();

  lowerBand = sliderVal;
  middleBand = sliderVal * midBandMult;
  higherBand = sliderVal * highBandMult;

  textAlign(LEFT);
  textSize(12);
  textStyle(NORMAL);

  text('Sensitivity: ' + str(sliderVal), 30, 60);
  
  

  // calculates frequency and places it into bands, returning current frequency
  let inByte = port.lastByte();
  if (inByte == 1 && dataIn) {
    sensorFreq = calculateFreq();

    if (sensorFreq > lowerBand && sensorFreq < middleBand) {
      greenAlpha += 0.2;
      if(greenAlpha > 1) {
        greenAlpha = 1;
      }
      lowBand();
    } else if (sensorFreq > middleBand && sensorFreq < higherBand) {
      yellowAlpha += 0.2;
      if(yellowAlpha > 1) {
        yellowAlpha = 1;
      }
      midBand();
    } else if (sensorFreq > higherBand) {
      redAlpha += 0.2;
      if(redAlpha > 1) {
        redAlpha = 1;
      }
      highBand();
    }
    
    

    // sensorFreq = 0;
    
  }

  push();
  let greenAlphaVal = map(greenAlpha, 0, 1, 0, 255);
  fill(color(255, 0, 0, greenAlphaVal));
  noStroke();
  circle(40, 30, 15);
  pop();

  push();
  let yellowAlphaVal = map(yellowAlpha, 0, 1, 0, 255);
  fill(color(255, 255, 0, yellowAlphaVal));
  noStroke();
  circle(60, 30, 15);
  pop();

  push()
  let redAlphaVal = map(redAlpha, 0, 1, 0, 255);
  fill(color(0, 255, 0, redAlphaVal));
  noStroke();
  circle(80, 30, 15);
  pop();

  

  text('Sensor Frequency: ' + sensorFreq.toFixed(2), 30, 90);
  


  //waveforms of samples
  for (let i in samplefftTable) {
    
    fill(sampleCols[i]);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(18);
    
    let loopName = str(mushyLoopNames[i] + ': ');
    let nameWidth = textWidth(loopName);
    if (nameWidth > maxNameWidth) {
      maxNameWidth = nameWidth;
    }

    text(loopName, 15, (i*elemGap) + textGap);

    let waveForm = samplefftTable[i].waveform();

    noFill();
    beginShape();
    stroke(sampleCols[i]);

    for (let j = 0; j < waveForm.length; j++){
      let x = map(j, 0, waveForm.length, 20 + maxNameWidth, width-20);
      let y = map(waveForm[j], -1, 1, (i*elemGap) + textGap - waveSize, (i*elemGap) + textGap + waveSize);
      vertex(x,y);
    }

    endShape();
  }

  //waveforms of drones
  for (let i in dronefftTable) {
    fill(textCol);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(18);
    text('drone ' + i + ': ', 15, ((int(i) + mushyLoopsNum) * elemGap) + textGap);

    let newWaveform = dronefftTable[i].waveform();

    noFill();
    beginShape();
    stroke(255);

    for (let j = 0; j < newWaveform.length; j++){
      let x = map(j, 0, newWaveform.length, 20 + maxNameWidth, width-20);
      let y = map(newWaveform[j], -1, 1, ((int(i) + mushyLoopsNum) * elemGap) + textGap - waveSize, ((int(i) + mushyLoopsNum) * elemGap) + textGap + waveSize) ;
      vertex(x,y);
    }

    endShape();
  }

  // Simulated frequency banding

  if (simulateCheck.checked() && dataIn) {
    sensorFreq = simulateSensor();
    if (sensorFreq > lowerBand && sensorFreq < middleBand) {
      
      greenAlpha += 0.2;
      if(greenAlpha > 1) {
        greenAlpha = 1;
      }
      
      lowBand();
    } else if (sensorFreq > middleBand && sensorFreq < higherBand) {
      
      yellowAlpha += 0.2;

      if(yellowAlpha > 1) {
        yellowAlpha = 1;
      }
      
      midBand();
    } else if (sensorFreq > higherBand) {
      
      redAlpha += 0.2;
      if(redAlpha > 1) {
        redAlpha = 1;
      }
      
      highBand();
    }
  }

  greenAlpha -= 0.05;
  yellowAlpha -= 0.05;
  redAlpha -= 0.05;

  if (greenAlpha < 0) {
    greenAlpha = 0;
  }

  if (yellowAlpha < 0) {
    yellowAlpha = 0;
  }

  if (redAlpha < 0) {
    redAlpha = 0;
  }

  // Sensor Data Graphing

  graphData(sensorFreq);
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
    fadeDroneBtnClick();
  } else {
    dataIn = false;
    fadeDroneBtnClick();
  }
  
}

function chanceValBtnClick() {
  // lowBandChance = float(lowInput.value()) * randomChance;
  // midBandChance = float(midInput.value()) * randomChance;
  // highBandChance = float(highInput.value()) * randomChance;

  midBandMult = float(lowInput.value()) * randomChance;
  highBandMult = float(midInput.value()) * randomChance;
  

  console.log(lowBandChance);
  console.log(midBandChance);
  console.log(highBandChance);
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
  let chanceOfLoop = random(randomChance);
  
  if (chanceOfLoop > lowBandChance) {
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
  let chanceOfLoop = random(randomChance);
  
  if (chanceOfLoop > midBandChance) {
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
  let chanceOfLoop = random(randomChance);
  
  if (chanceOfLoop > highBandChance) {
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
  return(map(perlinX,0,1,8,19));
}


function graphData(newFreq) {
  freqTable.push(newFreq);
  freqTable.shift();

  // draw the graph
  stroke(255);
  noFill();
  beginShape();
  for (let x = 170; x < 250; x++) {
    stroke(255);
    let y = map(freqTable[x-170], 0, sensSlider.value() * 2, 100, 80);
    vertex(x, y);
  }
  endShape();
}
