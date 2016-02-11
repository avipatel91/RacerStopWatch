var StopWatch = function(){
    this.totalTime = 0;
    this.startTime = 0;
    this.running = false;
}

StopWatch.prototype.start = function() {
    if(!this.running){
        this.startTime = Date.now();
        this.running = true;
    }
    return this;
};

StopWatch.prototype.stop = function(){
    if(this.running){
        this.totalTime = this.totalTime + Date.now() - this.startTime;
        this.running = false;
    }
    return this;
};

StopWatch.prototype.log = function(){
    if(this.running){
        console.log(Date.now()-this.startTime + this.totalTime);
    }else{
        console.log(this.totalTime);
    }
};

StopWatch.prototype.reset = function(){
    this.running = false;
    this.totalTime = 0;
    this.startTime = 0;
    return this;
}


//*************************************
//***  Simple tests for stopwatch   ***
//*************************************

foo = new StopWatch();

console.assert(foo.start().stop().totalTime == 0, "foo.start().stop() == 0");

console.assert(foo.stop().stop().totalTime == 0, "foo.stop().stop() == 0");


/* Note: tests are dependent on setTimeout, which is an asynchronous event. 
 * Since it will be placed in the event queue loop, there can be a delay by a second. This 
 * is accounted for in my asseration)
*/
function assertRightTime(){
    console.assert(foo.totalTime - 1000 <=25, "Start and Stop difference was not 1000ms (given a spread of +25ms)");
}

function assertReset(){
    console.assert(foo.reset().totalTime == 0 && foo.startTime == 0, "Reset to zero");
}

setTimeout(foo.start.bind(foo), 1000);
setTimeout(foo.stop.bind(foo), 2000);
setTimeout(assertRightTime, 2000);
setTimeout(assertReset, 2000);

    
//*************************************
//***    Racer code starts here     ***
//*************************************


/* A singleton start time needs to be used in order to maintain fairness. Having a 
 * large amount of n racers will have a delay in calling the start method in later racers. 
 * Racer will hold value for the race start time. All individual start times 
 * will be ignored when determining the winner.
 */

/* We will have to manually assign the start time and set running to true because 
 * the start method in the individual stopwatch objects is of no value here considering
 * we are using a universal start time. There is no stop method because we are
 * stopping indvidual stop watches, however, a stop method can be implemented.
 */


/* BELOW ARE TWO EDGE CASES THAT ARE IMPORTANT BUT NOT ADDRESSED. 
   A WAY TO GO ABOUT SOLVING IT IS GIVEN.
 
 1.  Need to address edge case for same name being used on obj construction. Implementing a set
     to check for duplicates can address this issue. An error should be thrown in case of duplicates.
     e.g. foo = new Racer();
          foo = new Racer();   <-this should not create another object. An error should be thrown.
 
 2.  Additional racers should not be added after the race has started. A lock (not a resource lock) 
     should be implemented to prevent adding more racers. An error should be thrown if you add 
     another racer when the race is locked.
     e.g. foo = new Racer(); 
          Racer.all.start(); <-Racer boolean variable 'locked' == true
          bar = new Racer(); <-this should throw an error.
 */

var Racer = function(name){
    this.driverStopWatch = new StopWatch();
    if(Racer.all == undefined){
        Racer.all = [];
        /*The following is 0(n), which can hurt us if we have many racers and we try
         * stop one of them 0ms after we start the race. It will loop through n  racers
         * before stopping the desired racer, so elapsed time between start and first stop might be
         * greater than 0 ms.
         */
        //Very 'hacky' (modifiying array.prototype). I don't like it but it will do for now.
        Array.prototype.start = function(){
            Racer.raceStartTime = Date.now();
            for(var racer in Racer.all){
                if(Racer.all.hasOwnProperty(racer)){
                    Racer.all[racer].driverStopWatch.running = true;
                    Racer.all[racer].driverStopWatch.startTime = Racer.raceStartTime;
                }
            }
        } 
        Racer.winner = null;
    }
    Racer.all.push(this)
}

Racer.prototype.stop = function(){
    this.driverStopWatch.stop();
    if(Racer.winner == null){
        Racer.winner = this;
    }
    return this;
}

Racer.prototype.log = function(){
    this.driverStopWatch.log();
}

/* The following getter function is not necessary, considering I have a variable that has the value,
 * but I will abide by specs.
 */
Racer.getWinner = function(){
    return this.winner;
}


//*************************************
//***    Simple tests for Racer     ***
//*************************************

var summeet = new Racer();
var travis = new Racer();
var harshit = new Racer();

console.assert(Racer.all[0] === summeet,'Racer.all[0] === summeet');
console.assert(Racer.all[1] === travis, 'Racer.all[1] === travis');
console.assert(Racer.all[2] === harshit, 'Racer.all[2] === harshit');

function timeCheckTest(driver, timeElapsed){
    console.assert(driver.driverStopWatch.totalTime <= timeElapsed + 25, 
            'driver.driverStopWatch.totalTime == ' + timeElapsed);
}

Racer.all.start();
summeet.stop();
timeCheckTest(summeet, 0)
setTimeout(travis.stop.bind(travis), 1000);
setTimeout(timeCheckTest, 1000, travis, 1000);
setTimeout(harshit.stop.bind(harshit), 2000);
setTimeout(timeCheckTest, 2000, harshit, 2000);

setTimeout(summeet.log.bind(summeet), 3000);
setTimeout(travis.log.bind(travis), 3000);
setTimeout(harshit.log.bind(harshit), 3000);

function winnerTest(driver){
    console.assert(Racer.getWinner() == driver, "Racer.getWinner() = driver");
}

setTimeout(winnerTest, 3000, summeet);
