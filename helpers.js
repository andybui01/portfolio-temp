function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function closest_nodee(nodes, source, radius) {
    var n = nodes.length,
        dx,
        dy,
        d2,
        node,
        closest;

    if (radius == null) radius = Infinity;
    else radius *= radius;

    for (var i = 0; i < n; ++i) {

        node = nodes[i];

        if (node == source) continue;

        dx = source.x - node.x;
        dy = source.y - node.y;
        d2 = dx * dx + dy * dy;
        if (d2 < radius) closest = node, radius = d2;

    }
    return closest;
}

function plusInfect() {
    HEALTHY_COUNT--;
    INFECTED_COUNT++;
}

function plusRecover() {
    INFECTED_COUNT--;
    RECOVERED_COUNT++;
}

function plusTime() {
    data[time] = {
        time: time,
        recovered: RECOVERED_COUNT,
        infected: INFECTED_COUNT,
        healthy: HEALTHY_COUNT
        
    }
    time++;
    // Refresh graph
    d3.select("div#reload").select("div#chart").remove();
    d3.select("div#reload").append("div").attr("id", "chart");

    draw();
}