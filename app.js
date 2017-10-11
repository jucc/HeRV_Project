// JavaScript code for HerV Project app.
// The code is inside a closure to avoid polluting the global scope.

// APP VARIABLES
var faketimer = 0;
var hrvcentralvalue;
var hrvmin;
var hrvmax;
var gameFlag;


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
      $('#activateGame').toggleClass('mdl-color--blue-500 mdl-button--disabled')
      $(this).toggleClass('app-start-scan app-stop-scan')
      $('#activateGame').prop('disabled', true)
      startScan();
    }
    else
    {
      $(this).html('Monitorar')
      $(this).toggleClass('mdl-color--green-A700 mdl-color--deep-orange-900')
      $('#activateGame').toggleClass('mdl-color--blue-500 mdl-button--disabled')
      $(this).toggleClass('app-start-scan app-stop-scan')
      $('#activateGame').prop('disabled', false)
      clearScreen();
      stopScan();
    }
  })

  $('#activateGame').on('click', function(){
    if ( $(this).hasClass('inactive') )
    {
      $(this).html('Parar')
      $(this).toggleClass('mdl-color--blue-500 mdl-color--deep-orange-900')
      $(this).toggleClass('inactive active')
      $('#onoffbt').prop('disabled', true)
      $('#onoffbt').toggleClass('mdl-color--green-A700 mdl-button--disabled')
      gameFlag = true;
      startGame();
    }
    else
    {
      $(this).html('Jogar')
      $(this).toggleClass('mdl-color--blue-500 mdl-color--deep-orange-900')
      $('#onoffbt').toggleClass('mdl-color--green-A700 mdl-button--disabled')
      $(this).toggleClass('inactive active')
      $('#onoffbt').prop('disabled', false)
      gameFlag = false;
      clearScreen();
      stopGame();
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
            
            if( gameFlag )
            {
              faketimer += 1;

              // Can we do it better?
              if (faketimer <= 10)
              {
                if (faketimer == 1) { statusCalibrating(); }

                // To play with the RR Intervals
                //myGamePiece.updateHistory(hrm[0]);
                
                // To play with the heart measure
                myGamePiece.updateHistory(hrm.heartRate);
              }
              else
              {
                if (faketimer == 11)
                {
                  clearCalibrating();
                  hrvcentralvalue = Math.floor(myGamePiece.hrvmedia());
                  putOnScreen('Média: ' + hrvcentralvalue);
                  myGamePiece.setMinMax();
                  myGameArea.start();
                  hrvcentralvalue = putOnScale(hrvcentralvalue);
                  accelerate(hrvcentralvalue);
                }
                updateHeartRate(hrm.heartRate);
                //if (putOnScale(hrm[0]) > hrvcentralvalue) { accelerate(myGamePiece.y-5); }
                if (putOnScale(hrm.heartRate) > hrvcentralvalue) { accelerate(myGamePiece.y-5); }
                //if (putOnScale(hrm[0]) < hrvcentralvalue) { accelerate(myGamePiece.y+5); }
                if (putOnScale(hrm.heartRate) < hrvcentralvalue) { accelerate(myGamePiece.y+5); }
              }
            }
            else
            {
              // Shows Heart Rate Mesurement.
              updateHeartRate(hrm.heartRate);

              // Transforme the object to a string.
              hrm = JSON.stringify(hrm.rrIntervals);

              // Create a vector with one or two mesurements.
              hrm = hrm.replace('[','');
              hrm = hrm.replace(']','');
              hrm = hrm.split(',');

              // Shows RR Intervals
              updateRRInterval(hrm[0]);
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


function updateHeartRate(data)
{
  var element = $(
    '<div class="mdl-card__supporting-text">Batimento Cardíaco: ' + data + '</div>')
  $('#hrm').html(element)
}
function updateRRInterval(data)
{
  var element = $(
  '<div class="mdl-card__supporting-text">Intervalo RR: ' + data + '</div>')
  $('#statusText').html(element);
}

function clearScreen()
{
  $('#hrm').empty();
  $('#statusText').empty();
  $('.app-cards').empty();
  $('#game-canvas').empty();
  $('#barra').empty();
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
  + '<button id="activateGame" class="inactive app-game mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color-text--white mdl-color--blue-500">'
  + 'Jogar'
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
  this.setMinMax = function(){
    hrvmax = 0;
    hrvmin = 99999;
    for(var i = 0; i < this.hrvhistory.length; ++i)
    {
      if (hrvmax < this.hrvhistory[i]) { hrvmax = this.hrvhistory[i]; }
      if (hrvmin > this.hrvhistory[i]) { hrvmin = this.hrvhistory[i]; }
    }
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
  var x =  ((myGameArea.canvas.height-30)*(value-hrvmin)/(hrvmax-hrvmin))+30;
  return x;
}
/******* GAME AREA CODE END *******/


// START APP
main();

