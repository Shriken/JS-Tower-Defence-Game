$(document).ready(function () {
    //Canvas variables
    var canvas;
    var ctx;
    //mobs globals
    var mobArray = [];
    var mobsArrived = 0;
    var arrivingGaps = 1000;
    var Xlimits = [370, 600, 920, 1070, 1220];
    var Ylimits = [270, 370, 100, 550, 210, 1000];
    //towers globals
    var towers = [];
    var motion;
    var towerIndex = 1;
    //player stats
    var cash = 1000;
    var lives = 30;
    //Setup waves:
    var waveNum = 0;
    var waves = [
        [7, 2, 0],
        [10, 3, 0],
        [10, 5, 0],
        [15, 5, 5],
        [15, 10, 7]
    ]

    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', drawEverything, false);
    openingMotion();

    function openingMotion() {
        initLevel();
        initMobs(10, 20, 10);
        motion = setInterval(drawEverything, 30);
        $('.gameWrap').addClass('blur-in');
    }

    function staging() { // staging phase between waves
        $('.gameWrap').removeClass('blur-in');
        $('.gameWrap').addClass('blur-out');
        var menu = $('.introwrapper');
        menu.css({ 'display': 'none' });
        clearInterval(motion);
        $('#nextWaveBtn').css({ 'display': 'block' });
        $('#towersMenuToggle').css({ 'display': 'block' });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    $("#startBtn").click(staging); // assign rollGame to start button

    function startWave() {
        initMobs(waves[waveNum][0], waves[waveNum][1], waves[waveNum][2]);
        waveNum++;
        motion = setInterval(drawEverything, 30);
    }
    $("#nextWaveBtn").click(startWave);

    function initMobs(red, yellow, green) {
        mobsArrived = 0;
        mobArray = [];
        arrivingGaps = 1000;

        for (var i = 1; i < red; i++) {
            var mobInstance = new redMob();
            mobArray.push(mobInstance);
        }

        for (var i = 1; i < yellow; i++) {
            var mobInstance = new yellowMob();
            mobArray.push(mobInstance);
        }

        for (var k = 1; k < green; k++) {
            var mobInstance = new greenMob();
            mobArray.push(mobInstance);
        }
    }

    function createTower(type, radius, fireRate) {
        switch (type) { // create object of given type
            case 'cannon':
                var mytower = new cannon("tower" + towerIndex);
        }
        towers.push(mytower);
        towerIndex++;
    }

    function mobSchedule() {
        mobArray[mobsArrived].arrive = 1;
        mobsArrived = mobsArrived + 1;
    }

    function drawEverything() {
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        var canvasEndingCondition = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (mobsArrived < mobArray.length && arrivingGaps % 15 == 0) {
            //setTimeout(mobSchedule,1000);
            mobSchedule();
        }
        if (mobsArrived < mobArray.length) { arrivingGaps--; }
        mobArray.forEach(function (thisMob) {
            var i = mobArray.indexOf(thisMob);
            if (thisMob != undefined) {
                if (thisMob.hp > 0 && thisMob.arrive == 1) {
                    //Draw the mob
                    rectColor(thisMob.posx, thisMob.posy, thisMob.height, thisMob.width, thisMob.color);
                    if (thisMob.hp < 100) { //Show hp bar above injured mob
                        rectColor(thisMob.posx - 3, thisMob.posy - 5, 17, 3, 'white');
                        rectColor(thisMob.posx - 3, thisMob.posy - 5, 17 * (thisMob.hp / 100), 3, 'red');
                    }
                    //Determine advance path
                    if (thisMob.currentDirection < 2) { advanceOnY(thisMob); }
                    else { advanceOnX(thisMob); }
                    if (thisMob.posy > 650) {
                        canvasEndingCondition++;
                        lives = lives - 1;
                        $('#lives').text(lives);
                        mobArray.splice(i, 1);
                    }
                }
                //If mob is dead, remove it.
                if (thisMob.hp == 0) {
                    rectColor(thisMob.posx, thisMob.posy, thisMob.height, thisMob.width, 'black');
                    updateCash(thisMob.worth);
                    mobArray.splice(i, 1);
                }
                //For each tower, determine whether the mob is INSIDE fire range. if so, push to target queue
                towers.forEach(function (thisTower) {
                    var mobIndex = mobArray.indexOf(thisMob);
                    if ((thisMob.posx > (thisTower.center[0] - thisTower.range)) && (thisMob.posx < (thisTower.center[0] + thisTower.range)) && (thisMob.posy < (thisTower.center[1] + thisTower.range)) && (thisMob.posy > (thisTower.center[1] - thisTower.range))) {
                        if (thisTower.targetQueue.length < mobArray.length && jQuery.inArray(mobIndex, thisTower.targetQueue) == -1) { // if the target queue is not full
                            thisTower.targetQueue.push(mobIndex);
                        }
                    }
                    else {
                        if (thisTower.targetQueue.includes(mobIndex)) { // if the mob index is in the target queue and out of range, remove it.
                            var indexInQueue = thisTower.targetQueue.indexOf(mobIndex);
                            thisTower.targetQueue.splice(indexInQueue, 1);
                        }
                    }

                });

            }

        });
        // Manage each tower target queue priority + Rotate & Fire system.
        towers.forEach(function (thisTower) {
            if (thisTower.targetQueue[0] != null) {
                var target = thisTower.targetQueue[0];
                var clockwise;
                // THIS BLOCK TO PRIORITIZE TARGETS // 
                var tq = thisTower.targetQueue;
                var max = 0;
                var i;
                for (var j = 0; j < tq.length; j++) {
                    if (mobArray[tq[j]] == null) {
                        tq.splice(j, 1);
                        j--;
                    }
                    else {
                        if (mobArray[tq[j]].pxMade > max) {
                            max = mobArray[tq[j]].pxMade;
                            i = j;
                        }
                    }

                }
                var holder;
                if (mobArray[tq[0]] != undefined && mobArray[tq[0]].hp == 100) {
                    holder = tq[0];
                    tq[0] = tq[i];
                    tq[i] = holder;
                }
                thisTower.targetQueue = tq;
                // END // 
                if (mobArray[target] != null) {
                    //get angle to mob:
                    var angle = Math.atan2(mobArray[target].posx - thisTower.center[0], -(mobArray[target].posy - thisTower.center[1])) * (180 / Math.PI);
                    var posAngel; // Positive angle representation (0 to 360)
                    if (angle < 0) {
                        posAngel = Math.ceil(angle + 360);
                    }
                    else {
                        posAngel = Math.ceil(angle);
                    }
                    updateDirection();
                    for (var i = 0; i < 10; i++) { // for loop to create rotating animation
                        if (thisTower.currentAngle == posAngel) {
                            thisTower.fixedOnTarget = true;
                            break;
                        }
                        updateAngle();
                        rotateTower();
                    }
                    if (thisTower.fixedOnTarget === true) {
                        if (thisTower.rateCounter == thisTower.hitRate) {
                            if (thisTower.fire(target)) {
                                mobArray[target].hp = mobArray[target].hp - 50;
                                mobArray[target].hp = mobArray[target].hp + mobArray[target].recovery;
                                if (mobArray[target].hp <= 0) {
                                    mobArray[target].hp = 0;
                                    thisTower.targetQueue.splice(0, 1);
                                    thisTower.fixedOnTarget = false;
                                }
                                thisTower.rateCounter = 0;
                            }
                        }
                        else {
                            thisTower.rateCounter++;
                        }
                    }
                }
                else {
                    thisTower.targetQueue.splice(0, 1);
                    thisTower.fixedOnTarget = false;
                }
            }
            function updateDirection() { // will work with while look to accomplish partial rotate each callback
                if (posAngel > thisTower.currentAngle) {
                    if (posAngel - thisTower.currentAngle > 180) {
                        clockwise = false;//counterclockwise
                    }
                    else {
                        clockwise = true;//clockwise
                    }
                }
                else {
                    if (thisTower.currentAngle - posAngel > 180) {
                        clockwise = true;//counterclockwise
                    }
                    else {
                        clockwise = false;//clockwise
                    }
                }
            }
            function updateAngle() {
                if (clockwise === true) {
                    thisTower.changeAngle('up');
                }
                else {
                    thisTower.changeAngle('down');
                }
            }
            function rotateTower() {
                thisTower.element.css({ "-webkit-transform": 'rotate(' + thisTower.currentAngle + 'deg)' });
                thisTower.element.css({ '-moz-transform': 'rotate(' + thisTower.currentAngle + 'deg)' });
                thisTower.element.css({ 'transform': 'rotate(' + thisTower.currentAngle + 'deg)' });
            }
        });
        $('.priceTag').each(function () {
            if (cash < $(this).text()) {
                $(this).parent().css({ 'opacity': '0.3' }).attr('disabled', 'disabled');
            }
            else {
                if ($(this).parent().attr('disabled') == "disabled") {
                    $(this).parent().css({ 'opacity': '1' }).removeAttr('disabled');
                }

            }
        });
        if (canvasEndingCondition == mobArray.length) { console.log(clearInterval(motion)); }
    }


    // Mobs movement orders
    function advanceOnY(mob) {
        if (mob.currentDirection == 0) { // going downwards
            mob.posy = mob.posy + mob.speed;
            mob.pxMade = mob.pxMade + mob.speed;
            if (mob.posy > Ylimits[mob.limitPassedY] - (mob.startingposx - 90)) {
                if (Ylimits[mob.limitPassedY + 1] > Ylimits[mob.limitPassedY]) { mob.currentDirection = 2; }
                else { mob.currentDirection = 3; }
                mob.limitPassedY++;
            }
        }
        else { // going upwards
            mob.posy = mob.posy - mob.speed;
            mob.pxMade = mob.pxMade + mob.speed;
            if (mob.posy < Ylimits[mob.limitPassedY] + (60 - (mob.startingposx - 100))) {
                if (Ylimits[mob.limitPassedY + 1] > Ylimits[mob.limitPassedY]) { mob.currentDirection = 2; }
                else { mob.currentDirection = 3; }
                mob.limitPassedY++;
            }
        }
    }

    function advanceOnX(mob) {
        if (mob.currentDirection == 2) { // next Y advance is downwards
            mob.posx = mob.posx + mob.speed;
            mob.pxMade = mob.pxMade + mob.speed;
            if (mob.posx > Xlimits[mob.limitPassedX] - (85 - (mob.startingposx - 90))) {
                mob.currentDirection = 0;
                mob.limitPassedX++;
            }
        }
        else {
            mob.posx = mob.posx + mob.speed;
            mob.pxMade = mob.pxMade + mob.speed;
            if (mob.posx > Xlimits[mob.limitPassedX] - (mob.startingposx - 90)) {
                mob.currentDirection = 1;
                mob.limitPassedX++;
            }
        }
    }

    function rectColor(posx, posy, width, height, color) {
        ctx.fillStyle = color;
        ctx.fillRect(posx, posy, width, height);
    }


    function popTM() {
        $('.pop-up').fadeIn(600);
        $('.canvasWrap').removeClass('blur-out');
        $('.canvasWrap').addClass('blur-in');
        $('.close-button').click(function (e) {
            closePopup();
        });
    }
    $("#towersMenuToggle").click(popTM);

    function closePopup() {
        $('.pop-up').fadeOut(100);
        $('.canvasWrap').removeClass('blur-in');
        $('.canvasWrap').addClass('blur-out');
    }


    $(".towerDiv").click(function () {
        var $item = $(this);
        if ($item.attr('disabled') == "disabled") { // if there is not enough funds, click is disabled
            return false; // do nothing
        }
        closePopup();
        var $clone = $(".towerDiv > .cannonDisp");
        var $this = $clone.clone();
        var buildConfirm = true;
        $this.appendTo('body').attr("id", "tempTower").addClass('radiusRep').css('height', 230 + 'px').css('width', 220 + 'px');
        $(document).mousemove(function (e) {
            $this.offset({
                top: e.pageY - $this.height() / 2,
                left: e.pageX - $this.width() / 2
            });
            buildConfirm = true;
            $(".tower").each(function () {
                var otherOS = $(this).offset();
                var thischild = $this.children().first();
                var thisOS = thischild.offset();
                if (!(thisOS.top + thischild.height() < otherOS.top ||
                    thisOS.left > otherOS.left + $(this).width() ||
                    thisOS.left + thischild.width() < otherOS.left ||
                    thisOS.top > otherOS.top + $(this).height())) {
                    buildConfirm = false;
                }
            });
            if (buildConfirm === false) {
                $this.children().first().css({ 'border': '2px solid red' });
            }
            else {
                $this.children().first().css({ 'border': 'none' });
            }
        });
        $(document).dblclick(function (e) {
            if (buildConfirm != false) {
                //$('#tempTower').removeClass("towerDisplay");
                $('#tempTower').css({ 'border': 'none' });
                $('#tempTower').children().addClass("tower");
                $('#tempTower').children('.towerDisplay').attr("id", "tower" + towerIndex);
                $('#tempTower').attr("id", "towerWrap" + towerIndex);
                createTower('cannon', 150, 30);
                updateCash(-parseInt($item.find('.priceTag').text()));
                $(document).unbind("mousemove");
                $(document).unbind("dblclick");
            }
            else {
                alert('hhaha u cant build here, idiot!');
            }


        });
    });
    function updateCash(diff) {
        cash = cash + diff;
        $('#cash').text(cash);
    }
    function initLevel() { // Create grid for mobs track - run once at page load.
        $('#cash').text(cash);
        $('#lives').text(lives);
    }

    // OBJECTS CREATION //

    function mob(height, width, speed, recovery, color) {
        this.startingposx = Math.floor(Math.random() * (160 - 100 + 1)) + 100;
        this.posx = this.startingposx;
        this.posy = 0;
        this.height = height;
        this.width = width;
        this.arrive = 0;
        this.hp = 100;
        this.recovery = recovery;
        this.speed = speed;
        this.worth = 20;
        this.pxMade = 0;
        this.color = color;
        this.type = 'Very easy';
        this.limitPassedY = 0;
        this.limitPassedX = 0;
        this.currentDirection = 0; // 0 for Y down, 1 for Y up, 2 for X right, 3 for X left
    }
    //Mob types:
    function redMob() {
        mob.call(this, 10, 10, 2, 0, 'red');
    }
    redMob.prototype = Object.create(mob.prototype);
    redMob.prototype.constructor = redMob;

    function greenMob() {
        mob.call(this, 10, 10, 3, 0, 'green');
    }
    greenMob.prototype = Object.create(mob.prototype);
    greenMob.prototype.constructor = greenMob;

    function yellowMob() {
        mob.call(this, 13, 13, 2, 20, 'yellow');
    }
    yellowMob.prototype = Object.create(mob.prototype);
    yellowMob.prototype.constructor = yellowMob;

    //General tower:
    function tower(id, type, range, hitRate) { // range is a radius
        this.id = id;
        this.src = 'images/' + this.type + '.png';
        this.element = $('#' + this.id);
        this.range = range;
        this.center = 0;
        this.targetQueue = [];
        this.hitRate = hitRate;
        this.rateCounter = 0;
        this.currentAngle = 0;
        this.fixedOnTarget = false;
        this.center = [this.element.offset().left + this.element.width() / 2, this.element.offset().top + this.element.height() / 2];
    }
    tower.prototype.changeAngle = function (dir) {
        if (dir == 'up') {
            if (this.currentAngle == 360) { this.currentAngle = 0; }
            this.currentAngle++;
        }
        else {
            if (this.currentAngle == 0) { this.currentAngle = 360; }
            this.currentAngle--;
        }
    }
    // Cannon type:
    function cannon(id) {
        tower.call(this, id, 'cannon', 150, 30);
        this.bulletPosX = this.center[0];
        this.bulletPosY = this.center[1];
        this.previousTarget;
    }
    cannon.prototype = Object.create(tower.prototype);
    cannon.prototype.constructor = cannon;
    cannon.prototype.fire = function (target) {
        if (target!=this.previousTarget){
            this.bulletPosX = this.center[0];
            this.bulletPosY = this.center[1];
        }
        this.previousTarget=target;
        var mx = mobArray[target].posx;
        var my = mobArray[target].posy;
        var bx = this.bulletPosX;
        var by = this.bulletPosY;
        var data = distanceAndAngleBetweenTwoPoints(bx, by, mx, my);
        var velocity = data.distance / 3;
        var toVector = new Vector(velocity, data.angle);
        bx += (toVector.magnitudeX);
        by += (toVector.magnitudeY);
        ctx.fillStyle='red';
        ctx.fillRect(bx,by,7,7);
        console.log(data.distance);
        if (data.distance<8) {
            console.log('wooo');
            this.bulletPosX = this.center[0];
            this.bulletPosY = this.center[1];
            return true;
        }
        this.bulletPosX = bx;
        this.bulletPosY = by;
    }
    function Vector(magnitude, angle) {
        var angleRadians = (angle * Math.PI) / 180;
        this.magnitudeX = magnitude * Math.cos(angleRadians);
        this.magnitudeY = magnitude * Math.sin(angleRadians);
    }
    function distanceAndAngleBetweenTwoPoints(x1, y1, x2, y2) {
        var x = x2 - x1;
        var y = y2 - y1;

        return {
            // x^2 + y^2 = r^2
            distance: Math.sqrt(x * x + y * y),

            // convert from radians to degrees
            angle: Math.atan2(y, x) * 180 / Math.PI
        }
    }

});






