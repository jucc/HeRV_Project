// This game was inspired by: https://www.w3schools.com/graphics/game_intro.asp

var myGamePiece;
var myObstacles = [];
var myScore;


function startGame() {
  myGamePiece = new gamePiece(10, 120, 'red', 30, 30);
  myGamePiece.gravity = 0.05;
  myScore = new scorePlacar('black');
  myGameArea.start();
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
      hrvhistory.push(value);
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
    this.newPos = function() {
        this.gravitySpeed += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY + this.gravitySpeed;
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
    if (myGameArea.frameNo == 1 || everyinterval(150)) {
        x = myGameArea.canvas.width;
        y = Math.floor(Math.random() * (myGameArea.canvas.height - 49)) + 40;
        myObstacles.push(new obstacle(x, y, 'green', 10));
    }
    for (i = 0; i < myObstacles.length; i += 1) {
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

// Trying to make it work with scree tap.
// $("game-canvas").bind("tap", accelerate(-0.2));