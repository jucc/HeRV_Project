// JavaScript code for HerV Project app.
// The code is inside a closure to avoid polluting the global scope.

// APP VARIABLES
var faketimer = 0;
var hrvcentralvalue;
var hrvmin;
var hrvmax;
var trainningOp = 0;

// optionFlag
// -1 - null option
// 0 - heart monitor
// 1 - HeRV game
// 2 - trainning
var optionFlag = -1;
var caliTime = 6;


// GAME VARIABLES
var myGamePiece;
var myObstacles = [];
var myScore;


/******* APP AREA CODE BEGIN *******/
function main()
{
  $(function()
  {
    // Event listener for Back button.
    $('.app-back').on('click', function() { history.back() })
    initialbuttons();
  })

  // Event handler called when Cordova plugins have loaded.
  document.addEventListener(
    'deviceready',
    onDeviceReady,
    false)
}

function onDeviceReady()
{

  $('.mdl-progress').hide();

  // Attach event listeners.
  $('#onoffbt').on('click', function(){
    if ( $(this).hasClass('app-start-scan') )
    {
      $(this).html('Parar')
      $(this).toggleClass('mdl-color--green-A700 mdl-color--deep-orange-900')
      $('#trainning').toggleClass('mdl-color--green-A700 mdl-button--disabled')
      $('#activateGame').toggleClass('mdl-color--green-A700 mdl-button--disabled')
      $(this).toggleClass('app-start-scan app-stop-scan')
      $('#activateGame').prop('disabled', true)
      $('#trainning').prop('disabled', true)
      optionFlag = 0;
      startScan();
    }
    else
    {
      $(this).html('Monitorar')
      $(this).toggleClass('mdl-color--green-A700 mdl-color--deep-orange-900')
      $('#activateGame').toggleClass('mdl-color--green-A700 mdl-button--disabled')
      $('#trainning').toggleClass('mdl-color--green-A700 mdl-button--disabled')
      $(this).toggleClass('app-start-scan app-stop-scan')
      $('#activateGame').prop('disabled', false)
      $('#trainning').prop('disabled', false)
      optionFlag = -1;
      clearScreen();
      stopScan();
    }
  })
  $('#activateGame').on('click', function(){
    if ( $(this).hasClass('inactive') )
    {
      $(this).html('Parar')
      $(this).toggleClass('mdl-color--green-A700 mdl-color--deep-orange-900')
      $(this).toggleClass('inactive active')
      $('#onoffbt').prop('disabled', true)
      $('#trainning').prop('disabled', true)
      $('#onoffbt').toggleClass('mdl-color--green-A700 mdl-button--disabled')
      $('#trainning').toggleClass('mdl-color--green-A700 mdl-button--disabled')
      optionFlag = 1;
      startGame();
    }
    else
    {
      $(this).html('Jogar')
      $(this).toggleClass('mdl-color--green-A700 mdl-color--deep-orange-900')
      $('#onoffbt').toggleClass('mdl-color--green-A700 mdl-button--disabled')
      $('#trainning').toggleClass('mdl-color--green-A700 mdl-button--disabled')
      $(this).toggleClass('inactive active')
      $('#onoffbt').prop('disabled', false)
      $('#trainning').prop('disabled', false)
      $('.mdl-progress').hide();
      optionFlag = -1;
      clearScreen();
      stopGame();
    }
  })
  $('#trainning').on('click', function(){
    if ( $(this).hasClass('inactive') )
    {
      $(this).html('Finalizar')
      $(this).toggleClass('mdl-color--green-A700 mdl-color--deep-orange-900')
      $('#onoffbt').toggleClass('mdl-color--green-A700 mdl-button--disabled')
      $('#activateGame').toggleClass('mdl-color--green-A700 mdl-button--disabled')
      $(this).toggleClass('inactive active')
      $('#activateGame').prop('disabled', true)
      $('#onoffbt').prop('disabled', true)
      optionFlag = 2;
      startScan();

    }
    else
    {
      $(this).html('Treinar')
      $(this).toggleClass('mdl-color--green-A700 mdl-color--deep-orange-900')
      $('#activateGame').toggleClass('mdl-color--green-A700 mdl-button--disabled')
      $('#onoffbt').toggleClass('mdl-color--green-A700 mdl-button--disabled')
      $(this).toggleClass('inactive active')
      $('#activateGame').prop('disabled', false)
      $('#onoffbt').prop('disabled', false)
      optionFlag = -1;
      clearScreen();
      stopScan();
    }
  })

}


function startScan()
{

  evothings.easyble.stopScan();

  evothings.easyble.reportDeviceOnce(true);

  // Start scanning. Two callback functions are specified.
  evothings.easyble.startScan(
    function(device)
    {
      if ((device.name).toLowerCase().indexOf('polar h7') >= 0)
      {
        sensorFound(device);
      }

    },
    function(errorCode)
    {
      putOnScreen('Procedure error: ' + errorCode)
    }
  );
}

function sensorFound(device){

  device.connect(
  function(device)
  {
    clearScreen();
    showMessage('Conneted to ' + device.name + '!');

    device.readServices(
      null,
      function(device)
      {
        device.enableNotification(
          '00002a37-0000-1000-8000-00805f9b34fb',
          function(data)
          {
            // Formats the data from device.
            var hrm = parseHeartRate(data);
            
            // Heart Rate Mesurement.

            // Transforme the object to a string.
            var rrinterval = JSON.stringify(hrm.rrIntervals);

            // Create a vector with one or two mesurements.
            rrinterval = rrinterval.replace('[','');
            rrinterval = rrinterval.replace(']','');
            rrinterval = rrinterval.split(',');

            // Shows Data
            updateHeartRate(hrm.heartRate, rrinterval[0]);            

            // Game Mode
            if( optionFlag == 1 )
            {
              faketimer += 1;

              // Can we do it better?
              if (faketimer <= caliTime)
              {
                if (faketimer == 1) { statusCalibrating(); }

                // To play with the RR Intervals
                //myGamePiece.updateHistory(hrm[0]);
                
                // To play with the heart measure
                myGamePiece.updateHistory(hrm.heartRate);
              }
              else
              {
                if (faketimer == caliTime + 1)
                {
                  clearCalibrating();
                  // Uncomment to use the media instead of median.
                  //hrvcentralvalue = Math.floor(myGamePiece.hrvmedia());
                  //putOnScreen('Essa é sua média:' + hrvcentralvalue);

                  // Uses median to padronize the moviment.
                  hrvcentralvalue = Math.floor(myGamePiece.hrvmedian());
                  putOnScreen('Seu batimento mediano: ' + hrvcentralvalue);

                  // Takes the highest and lowest measures to scale game.
                  myGamePiece.setMinMax();

                  // Initiate game.
                  myGameArea.start();

                  // Puts the gamepiece in the 'center' of game area.
                  hrvcentralvalue = putOnScale(hrvcentralvalue);
                  accelerate(hrvcentralvalue);

                }

                //updateHeartRate(hrm.heartRate);
                
                // Uses HRM to move gamepiece.
                if (putOnScale(hrm.heartRate) > hrvcentralvalue) { accelerate(myGamePiece.y-20); }
                if (putOnScale(hrm.heartRate) < hrvcentralvalue) { accelerate(myGamePiece.y+20); }

                // Uncomment to use RR Intervals instead of HRM
                //if (putOnScale(rrinterval[0]) > hrvcentralvalue) { accelerate(myGamePiece.y-5); }
                //if (putOnScale(rrinterval[0]) < hrvcentralvalue) { accelerate(myGamePiece.y+5); }
              }
            }
              
            // Trainning Mode
            if (optionFlag == 2)
            {
              if( faketimer == 0)
              {
                startTimer(15);
              }

              // Generates Command every 120 heartmeasure. Can we make it better?
              if (faketimer % 120 == 0)
              {
                var opt = Math.floor(Math.random() * 3) + 1;
                
                // Ensure the same command won't be given twice in a row.
                while(opt == trainningOp){
                  opt = Math.floor(Math.random() * 3) + 1;
                }

                trainningOp = opt;

                switch(trainningOp){
                  case 1:
                    var element = $(
                      '<div class="mdl-card__supporting-text">Aumente seus batimentos!<br>'
                      + 'Batimento base: ' + hrm.heartRate+ '<br>'
                      + 'RR Intervalo base: ' + rrinterval[0] + '<br>'
                      + '</div>')
                    $('#commands').html(element)
                    break;
                  case 2:
                    var element = $(
                      '<div class="mdl-card__supporting-text">Mantenha seus batimentos constantes!<br>'
                      + 'Batimento base: ' + hrm.heartRate+ '<br>'
                      + 'RR Intervalo base: ' + rrinterval[0] + '<br>'
                      + '</div>')
                    $('#commands').html(element)
                    break;
                  case 3:
                    var element = $(
                      '<div class="mdl-card__supporting-text">Diminua seus batimentos!<br>'
                      + 'Batimento base: ' + hrm.heartRate+ '<br>'
                      + 'RR Intervalo base: ' + rrinterval[0] + '<br>'
                      + '</div>')
                    $('#commands').html(element)
                }
              }

              faketimer += 1;

            }
          },
          function(errorCode)
          {
            putOnScreen('Error ' + errorCode);
          }
        );
      },
      function(errorCode)
      {
        putOnScreen('Error ' + errorCode);
      });
  },
  function(errorCode)
  {
    putOnScreen('Error ' + errorCode);
  });
}

function stopScan()
{
  // Stop ble scan.
  evothings.easyble.stopScan();
  evothings.easyble.closeConnectedDevices();
  showMessage('Device disconnected.');
  faketimer = 0;
}

function showMessage(message)
{
  document.querySelector('.mdl-snackbar').MaterialSnackbar.showSnackbar(
  {
    message: message
  });
}

function putOnScreen(message)
{
  // Create element.
  var element = $(
    '<div class="mdl-card__supporting-text">'
    +    message
    +  '</div>')

  // Add element.
  $('.app-cards').append(element);
}


// Creates a countdown timer of 'time' minutes.
// Parameter must be an integer greater than 1.
// Base code obtained from: https://www.w3schools.com/howto/howto_js_countdown.asp
function startTimer(time)
{
  // Set we're counting down to
  var countDownDate = new Date().getTime() + (60000 * time);

  // Update the count down every 1 second
  var repeat = setInterval(function() {
    // Get todays date and time
    var now = new Date().getTime();
    
    // Find the distance between now an the count down date
    var distance = countDownDate - now;

    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Output the result.
    if (days > 0)
    {
      var element = $('<div class="mdl-card__supporting-text"> Tempo restante: '
      + days + 'd ' 
      + hours + 'h ' 
      + minutes + 'm ' 
      + seconds + 's'
      + '</div>');      
      $('.app-cards').html(element);
    }
    else{
      if (hours > 0){
        var element = $('<div class="mdl-card__supporting-text"> Tempo restante: '
        + hours + 'h ' 
        + minutes + 'm ' 
        + seconds + 's'
        + '</div>'); 
        $('.app-cards').html(element);
      }
      else
      {
        var element = $('<div class="mdl-card__supporting-text"> Tempo restante: '
        + minutes + 'm ' 
        + seconds + 's'
        + '</div>'); 
        $('.app-cards').html(element);
      }
    }
    
    $('#trainning').on('click', function(){
      clearInterval(repeat);
    })

    // If the count down is over, write some text 
    if (distance < 0) {
      clearInterval(repeat);
      $('.app-cards').html('<div class="mdl-card__supporting-text">We are done for today!</div>');
    }
  }, 1000);
}

function updateHeartRate(data1, data2)
{
  var element = $(
    '<div class="mdl-card__supporting-text">Seu batimento cardíaco: ' + data1 + '<br>'
  + 'Intervalo RR: ' + data2 + '</div>')
  $('#hrm').html(element)
}
function updateRRInterval(data)
{
  var element = $(
  '<div class="mdl-card__supporting-text">Seu intervalo RR: ' + data + '</div>')
  $('#statusText').html(element);
}

function clearScreen()
{
  $('#hrm').empty();
  $('#statusText').empty();
  $('.app-cards').empty();
  $('#game-canvas').empty();
  $('#barra').empty();
  $('#commands').empty();
}

// Function to parse the Heart Rate Data
// Extracted from: https://github.com/WebBluetoothCG/demos/tree/gh-pages/heart-rate-sensor
function parseHeartRate(value) {
      value = value.buffer ? value : new DataView(value);
      let flags = value.getUint8(0);
      let rate16Bits = flags & 0x1;
      let result = {};
      let index = 1;
      if (rate16Bits) {
        result.heartRate = value.getUint16(index, /*littleEndian=*/true);
        index += 2;
      } else {
        result.heartRate = value.getUint8(index);
        index += 1;
      }
      let contactDetected = flags & 0x2;
      let contactSensorPresent = flags & 0x4;
      if (contactSensorPresent) {
        result.contactDetected = !!contactDetected;
      }
      let energyPresent = flags & 0x8;
      if (energyPresent) {
        result.energyExpended = value.getUint16(index, /*littleEndian=*/true);
        index += 2;
      }
      let rrIntervalPresent = flags & 0x10;
      if (rrIntervalPresent) {
        let rrIntervals = [];
        for (; index + 1 < value.byteLength; index += 2) {
          rrIntervals.push(value.getUint16(index, /*littleEndian=*/true));
        }
        result.rrIntervals = rrIntervals;
      }
      return result;
    }

function initialbuttons()
{
  // Create element.
  var element = $( 
    '<button id="onoffbt" class="app-start-scan mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color-text--white mdl-color--green-A700">'
  + 'Monitorar'
  + '</button>'
  + '<button id="activateGame" class="inactive app-game mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color-text--white mdl-color--green-A700">'
  + 'Jogar'
  + '</button>'
  + '<button id="trainning" class="inactive app-game mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color-text--white mdl-color--green-A700">'
  + 'Treinar'
  + '</button>');

  // Add element.
  $('#initial-buttons').html(element);
}

function statusCalibrating()
{
  // Create element.
  var element = $( 
    '<div class="mdl-card__supporting-text">Calibrando o jogo! Respire normalmente, isso demora aproximadamente 1 minuto...</div>'
  + '<div class="mdl-progress mdl-js-progress"></div>');

  // Add element.
  $('.mdl-progress').show();
  $('.app-cards').html(element);
}

function clearCalibrating()
{
  // Create element.
  var element = $( 
    '<div class="mdl-card__supporting-text">Vamos Jogar!</div>'
  );
  
  $('.mdl-progress').hide();
  // Add element.
  $('.app-cards').html(element);
}

/******* APP AREA CODE END *******/


/******* GAME AREA CODE BEGIN *******/
function startGame() 
{
  myGamePiece = new gamePiece(0, 0, 'red', 30, 30);
  myGamePiece.gravity = 0;
  myScore = new scorePlacar('black');

  startScan();
}

function stopGame()
{
  clearInterval(myGameArea.interval);
  myObstacles = [];
  faketimer = 0;
  stopScan();
  clearScreen();
}

var myGameArea = {
    canvas : document.createElement('canvas'),
    start : function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight/3;
        this.context = this.canvas.getContext('2d');
        var div = document.getElementById('game-canvas');
        div.appendChild(this.canvas);
        this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 20);
        },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function gamePiece(x, y, color, width, height){
  this.hrvhistory = [];
  this.score = 0;
  this.width = width;
  this.height = height;
  this.speedX = 0;
  this.speedY = 0;
  this.color = color;
  this.x = x;
  this.y = y;
  this.gravity = 0;
  this.gravitySpeed = 0;
  this.update = function() {
    ctx = myGameArea.context;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
  this.updateHistory = function(value){
    this.hrvhistory.push(Number(value));
  }
  this.hrvmedia = function(){
    var media = 0;
    for(var i = 0; i < this.hrvhistory.length; ++i)
    {
      media += this.hrvhistory[i];
    }
    media = media / this.hrvhistory.length;
    return media;
  }
  this.hrvmedian = function(){
    this.hrvhistory.sort();
    return this.hrvhistory[Math.ceil((this.hrvhistory.length-1)/2)];
  }
  this.setMinMax = function(){
    this.hrvhistory.sort();
    hrvmax = this.hrvhistory[this.hrvhistory.length-1];
    hrvmin = this.hrvhistory[0];
  }
  this.newPos = function() {
    this.y = this.gravity;
    this.hitBottom();
    this.hitTop();

  }
  this.hitBottom = function() {
    var rockbottom = myGameArea.canvas.height - this.height;
    if (this.y > rockbottom) {
      this.y = rockbottom;
      this.gravitySpeed = 0;
    }
  }
  this.hitTop = function() {
    var limitTop = 30;
    if (this.y < limitTop) {
      this.y = limitTop;
      this.gravitySpeed = 0;
    }
  }
  this.crashWith = function(otherobj) {
    var myleft = this.x;
    var myright = this.x + (this.width);
    var mytop = this.y;
    var mybottom = this.y + (this.height);
    var otherleft = otherobj.x - (otherobj.radius / 2);
    var otherright = otherobj.x + (otherobj.radius / 2);
    var othertop = otherobj.y - (otherobj.radius / 2);
    var otherbottom = otherobj.y + (otherobj.radius / 2);
    var crash = true;
    if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright) || otherobj.crashed) {
      crash = false;
    }
    if (crash) {
      otherobj.crashed = true;
    }
    return crash;
  }
}

function obstacle(x, y, color, radius){
  this.crashed = false;
    this.radius = radius;
    this.x = x;
    this.y = y;
    this.color = color;
    this.update = function() {
        ctx = myGameArea.context;
        ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.lineWidth = 1;
    //ctx.strokeStyle = '#003300';
    //ctx.stroke();
    }
}

function scorePlacar(color) {
    this.color = color;
    this.update = function() {
        ctx = myGameArea.context;
        ctx.font = '30px Arial';
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, 0, 30);
    }
}

function updateGameArea() {
    var x, y;
    for (i = 0; i < myObstacles.length; i += 1) {
      if (myGamePiece.crashWith(myObstacles[i])) {
        myGamePiece.score += 1;
        myScore.text = 'Score: ' + myGamePiece.score;
        myScore.update();
      } 
    }
    
    myGameArea.clear();
    myGameArea.frameNo += 1;
    if (myGameArea.frameNo == 1 || everyinterval(150))
    {
      x = myGameArea.canvas.width;
      y = Math.floor(Math.random() * (myGameArea.canvas.height - 49)) + 40;
      myObstacles.push(new obstacle(x, y, 'green', 10));
    }
    for (i = 0; i < myObstacles.length; i += 1) 
    {
      myObstacles[i].x += -1;
      myObstacles[i].update();
    }
    myGamePiece.newPos();
    myGamePiece.update();
    myScore.text = 'Score: ' + myGamePiece.score;
    myScore.update();
}

function everyinterval(n) {
  if ((myGameArea.frameNo / n) % 1 == 0) {return true;}
  return false;
}

// Used to control gamePiece. Insert hrv data here.
function accelerate(n) {
  myGamePiece.gravity = n;
}

// function to scale the rr measure
function putOnScale(value) {
  var scale =  ((myGameArea.canvas.height-30)*(value-hrvmin)/(hrvmax-hrvmin))+30;
  return scale;
}
/******* GAME AREA CODE END *******/


// START APP
main();

