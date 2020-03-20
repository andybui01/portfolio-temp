// Ball settings
const BALL_RADIUS = 5;

const HEALTHY = 'lightblue';
const INFECTED = 'orange';
const RECOVERED = 'pink'

// Array of ball states
const BALL_COLORS = [RECOVERED, HEALTHY, INFECTED];

// Degree of ball ISOLATION. Stepped from 0-1 by 0.1
var ISOLATION = 0;

// Canvas settings
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;

const BALL_COUNT = 200;
const SPEED = 10;

// Initialise Canvas
const state = {canvas: d3.select('svg#canvasSimulation')};
state.canvas.attr('width', CANVAS_WIDTH).attr('height', CANVAS_HEIGHT);

// Array of data, which we use to draw the area graph
var data;

// Counting ticks and time
var tick_count, time;

// Initialise status counts
var HEALTHY_COUNT, INFECTED_COUNT, RECOVERED_COUNT;

var balls = [], directions;


function start() {
    directions = [-1,1];

    // Counting ticks and time
    tick_count = 0;
    time = 0;

    // Initialise status counts
    HEALTHY_COUNT = BALL_COUNT;
    INFECTED_COUNT = 0;
    RECOVERED_COUNT = 0;

    data = [];

    generateBalls();
    
    plusInfect();
    plusTime();
} start();


// Generate ball initial positions and velocity
function generateBalls() {
    // atHome constant is used to make a certain amount of balls stay at home
    const atHome = (ISOLATION != 0) ? (ISOLATION * BALL_COUNT * 0.1): 1;

    balls = [];
    for (var i = 0; i < BALL_COUNT; i++) {
        var direction = directions[Math.floor(Math.random() * directions.length)];

        var init_vx, init_vy;

        // If ball is allowed to roam, generate its velocity
        if (i % atHome == 0) {
            var init_v = SPEED; // Hypotenuse SPEED

            init_vx = Math.floor((Math.random() * SPEED) + 1)*direction;

            direction = directions[Math.floor(Math.random() * directions.length)];

            init_vy = Math.sqrt(init_v**2 - init_vx**2)*direction;
        } else {
            init_vy = init_vx = 0; // If ball stays at home then velocity is 0
        }

        balls[i] = {
            x:getRandomInt(0,CANVAS_WIDTH),
            y:getRandomInt(0,CANVAS_HEIGHT),
            future: {vx: init_vx/10, vy: init_vy/10}, // Use future so that when we generate
            // nodes, vx and vy will be the speed & direction the ball travels in.

            // Set all balls to be healthy at first
            infected: false,
            recovered: false,
            tick_infected: null // tick_infected stores the tick when balls[i] got infected
        }
    }

    // Set first ball to be infected
    balls[0].infected = true;
    balls[0].tick_infected = 0;
}


// Setup force system
state.forceSim = d3.forceSimulation()
    .alphaDecay(0)
    .velocityDecay(0)
    .on('tick', () => { tick(state); }); // Every 'tick' of the simulation,
    // call tick to advance one step...

// Set to 'bounce' type of collision
state.forceSim.force('collision',
    d3.forceBounce().elasticity(1));

// Set collision radius
state.forceSim.force('collision').radius(n => n.r || BALL_RADIUS);

// Make ball bounce off walls
state.forceSim.force('walls', walls);

// Make balls change colour when infected
state.forceSim.force('infect', infect);

// Make balls change colour after recovering
state.forceSim.force('recover', recover);


// Walls - change directions after making contact with wall
function walls() {
    var ball;
    for (var i = 0; i < balls.length; i++) {
        ball = balls[i]
        
        if (ball.x - BALL_RADIUS < 0) {
            ball.x = BALL_RADIUS;
            ball.vx = -ball.vx;
        }
        if (ball.y - BALL_RADIUS < 0) {
            ball.y = BALL_RADIUS;
            ball.vy = -ball.vy;
        }
        if (ball.x + BALL_RADIUS > CANVAS_WIDTH) {
            ball.x = CANVAS_WIDTH - BALL_RADIUS;
            ball.vx = -ball.vx;
        }
        if (ball.y + BALL_RADIUS > CANVAS_HEIGHT) {
            ball.y = CANVAS_HEIGHT - BALL_RADIUS;
            ball.vy = -ball.vy;
        }
    }
}

// Infect - change colour after zombie ball infects healthy ball
function infect() {
    var ball,
        source;
    const nodes = state.forceSim.nodes();

    for (var i = 0; i < nodes.length; i++) {
        ball = nodes[i];

        source = document.getElementById("ball"+i.toString());
        try {
            if (balls[i].infected == false) {
                continue;
            }
            else {
                var closest_node = closest_nodee(nodes, ball, 2*BALL_RADIUS+1);
                if (closest_node != undefined) {
                    var idx = closest_node.index;

                    if (balls[idx].recovered == false && balls[idx].infected == false) {
                        d3.select("circle#ball"+idx.toString()).style("fill", INFECTED);
                        balls[idx].infected = true;
                        balls[idx].tick_infected = tick_count;
                        plusInfect();
                        plusTime();
                    }
                }
            }
        } catch (TypeError) {}
    }
}


// Recover - change colour after zombie ball becomes human again
function recover() {
    var ball;
    for (var i = 0; i < balls.length; i++) {
        ball = balls[i];
        
        if (ball.infected == false || ball.recovered == true) continue;

        if (tick_count - ball.tick_infected >= 1000) {
            ball.infected = false;
            ball.recovered = true;
            d3.select("circle#ball"+i.toString()).style("fill", RECOVERED);
            plusRecover();
            plusTime();
        }
    }
}


// Initial render
render();

// If user changes the isolation level, setIsolation restarts the animation with
// an amount of balls staying at home (dependent on user input).
function setIsolation(val) {
    ISOLATION = val; // change ISOLATION level
    start(); // (re)start the simulation

    // Recolour the balls
    for (var i = 0; i < BALL_COUNT; i++){
        if (balls[i].infected) {
            d3.select("circle#ball"+i.toString()).style("fill", INFECTED);
        } else {
            d3.select("circle#ball"+i.toString()).style("fill", HEALTHY);
        }
    }
    render();
}


// Tick moves the simulation forward by 1 frame, it checks the data set for any old
// data, removes the corresponding element, and makes a new element based on the new
// data entries.
function tick(state) {
    
    let ball = state.canvas.selectAll('circle.ball').data(state.forceSim.nodes());

	ball.exit().remove();

	ball.merge(
		ball.enter().append('circle')
			.classed('ball', true)
			.style('fill', function(d,idx) {
                if (idx == 0) {
                    return INFECTED;
                } else {
                    return HEALTHY;
                }
            })
	)
		.attr('r', d => d.r || BALL_RADIUS)
		.attr('cx', d => d.x)
		.attr('cy', d => d.y)
        .attr('id', (d, idx) => "ball"+idx.toString());
    

    // Generate live counter
    d3.select("span.healthy-count").text(HEALTHY_COUNT.toString());
    d3.select("span.infected-count").text(INFECTED_COUNT.toString());
    d3.select("span.recovered-count").text(RECOVERED_COUNT.toString());
    d3.select("span.time-count").text(time.toString());

    tick_count++;
}


// render() takes the balls[] array and converts them to nodes, which will then
// be used to draw the simulation.
//
// If restarting the simulation is required, call render() again.
function render() {
	// Clear all trails
	d3.selectAll('.trails').selectAll('*').remove();

    const sim = state.forceSim;

    // Initial state
    sim.nodes(balls);

    setTimeout(() => {
        // Apply future
        balls.filter(ball => ball.future).forEach(ball => {
            Object.keys(ball.future).forEach(attr => { ball[attr] = ball.future[attr]});
        });
    }, 800);

}