
//Define a config object that I can pass to forceNetwork()
config = {
    svgWidth: 600,
    svgHeight: 600,
    parentSelector: 'graphic-chart-container',
    continents: ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'],
    subGraphics: {
        home: [
            {
                id: 'explanatoryText',
                position: 'farLeftText',
                text: "Countries such as China, the United States, and India comprise a large portion of annual global C02 emissions."
            },
            {
                id: 'all-countries',
                position: 'position0',
                text: 'TEST'
            },
        ],
        enoughButton: [
            {
                id: 'explanatoryText',
                position: 'farLeftText',
                text: "The Climate Action Tracker assesses whether a country's efforts are expected to be enough to keep global C02 emissions under the 1.5°C target. Their data suggests that the heaviest emitters are not doing nearly enough and no countries that they have reviewed - big or small - have made sufficient commitments."
            },
            {
                id: 'critically-insufficient',
                position: 'position0',
                text: 'Critically insufficient'
            },
            {
                id: 'highly-insufficient',
                position: 'position1',
                text: 'Highly insufficient'
            },
            {
                id: 'insufficient',
                position: 'position2',
                text: 'Insufficient'
            },
            {
                id: 'almost-sufficient',
                position: 'position3',
                text: 'Almost sufficient'
            },
            {
                id: 'sufficient',
                position: 'position4',
                text: 'Sufficient'
            }
        ]
    }
};

d3.csv('data/all_data.csv').then(nodesData => {
    //Declare organizational variables
    let enoughOff = true;
    let view = 'home';

    //Convert to numeric
    nodesData.forEach(d => {
        d['co2'] = +d['co2'];
    });

    //Create div for tooltips
    let tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("opacity", 0);

    //Create container for the forceNetworks and text
    let chartParent = `<div id ="${config.parentSelector}"></div> `;
    document.querySelector('#mainGraphicContainer')
        .insertAdjacentHTML('beforeend', chartParent);

    drawGraphic(config, nodesData, view);

    //Draw legend - This code helped me - changed math and orientation: https://www.d3-graph-gallery.com/graph/custom_legend.html
    const colorScale = d3.scaleOrdinal().domain(config.continents).range(d3.schemeCategory10);   // call:    myColor(d);

    const legendSVG = d3.select("#legendContainer")
        .append('svg')
        .attr('width', config.svgWidth)
        .attr('height', 90);

    let size = 20
    legendSVG.selectAll("mydots")
        .data(config.continents)
        .enter()
        .append("rect")
        .attr("x", function (d, i) { return 20 + i * (size + 100) })
        .attr("y", 50)
        .attr("width", size)
        .attr("height", size)
        .style("fill", function (d) { return colorScale(d) })

    legendSVG.selectAll("mylabels")
        .data(config.continents)
        .enter()
        .append("text")
        .attr("x", function (d, i) { return 20 + i * (size + 100) + (size * 1.2) })
        .attr("y", 50 + size * .5)
        .style("fill", function (d) { return colorScale(d) })
        .text(function (d) { return d })
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")

    d3.selectAll('#enoughButton').on('click', (event) => {
        if (enoughOff) {
            view = event.srcElement.id;
            console.log('new view', view);
            drawGraphic(config, nodesData, view);
            enoughOff = false;
        }
        else {
            view = 'home';
            drawGraphic(config, nodesData, view);
            enoughOff = true;

        }

    });
});


//This is a function written by people at my job that I use a lot
function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

//Function that creates page structure specific to the number of networks being drawn
function drawGraphic(config, nodesData, view) {
    subGraphicElement = config.subGraphics[view];

    //Overwrite what is currently there with nothing
    if (document.querySelector(`#${config.parentSelector}`).innerHTML) {
        document.querySelector(`#${config.parentSelector}`).innerHTML = "";
    }

    //Create separate divs for each forceNetwork plot and draw network within each
    subGraphicElement.forEach(subGraphic => {
        let subDiv = `<div id ="${subGraphic.position}" class ="subGraphicContainer"></div> `;
        document.querySelector(`#${config.parentSelector}`)
            .insertAdjacentHTML('beforeend', subDiv);

        //Adjust the config for each forceNetwork subplot to have the subplot ID
        let subPlotConfig = deepCopy(config);
        subPlotConfig.parentSelector = `#${subGraphic.position}`;
        console.log('configCopy', subPlotConfig);

        //Draw network inside each subdiv
        forceNetwork(nodesData, subPlotConfig, view);
    });

}

/*Function that can be called within each div to draw a
network based on config*/
function forceNetwork(nodesData, config, view) {
    subGraphicElement = config.subGraphics[view];


    //Define scale to size by emissions
    const xScale = d3.scaleSqrt()
        .domain([.008, 10667.887])
        .range([5, 75]);

    const colorScale = d3.scaleOrdinal().domain(config.continents).range(d3.schemeCategory10);


    //Filter the config object to the subplot that is being drawn
    let graphicSelected = subGraphicElement.filter(d => {
        console.log(config.parentSelector);
        return d.position == config.parentSelector.replace('#', '');
    })[0];


    //Filter the dataset to the countries that fall in the category (if one is specified)
    let nodesDataFiltered;
    if ((view === 'enoughButton') && (graphicSelected['id'] !== 'explanatoryText')) {
        nodesDataFiltered = nodesData.filter(el => el['category'] === graphicSelected['id']);
    }
    else {
        nodesDataFiltered = nodesData.map(d => Object.create(d)); //Very important that this is a deep copy! Otherwise x and y positions don't adjust.

    }


    let svg;
    let simulationObj = {}
    if (config.parentSelector === '#farLeftText') { //Action needs to be slightly different for the explanatory text div of the view

        let divWidth;
        let divHeight;
        let lineHeight;
        if (view === 'home') {
            divWidth = '400px';
            divHeight = '600px';
            lineHeight = '600px';
        }
        else {
            divWidth = '300px';
            divHeight = '300px';
            lineHeight = '300px';

        }

        //Write explanatory text
        let subTitleDiv = `<div class ="subGraphicTitle">TEST</div><div id = "${graphicSelected.id}" class ="explanatoryText" style="width:${divWidth}; height:${divHeight};"><span>${graphicSelected.text}</span></div> `; //style="width:${divWidth}; height:${divHeight}; line-height:${lineHeight};"
        console.log('subTitleDiv', subTitleDiv);
        console.log('place inserted', document.querySelector(`${config.parentSelector} `));
        document.querySelector(`${config.parentSelector} `)
            .insertAdjacentHTML('beforeend', subTitleDiv);

    }
    else { //If not the explanatory text div then draw the network

        //Create a subgraphic div in container for force network
        let subTitleDiv = `<div id = "${graphicSelected.id}" class ="subGraphicTitle"> ${graphicSelected.text}</div> `;
        document.querySelector(`${config.parentSelector} `)
            .insertAdjacentHTML('beforeend', subTitleDiv);

        //Create force simulation
        if (view === 'home') {
            simulationObj[graphicSelected.id] = d3.forceSimulation(nodesDataFiltered)
                .force("charge", d3.forceManyBody().strength(.2))
                .force("center", d3.forceCenter().x(config.svgWidth / 2).y(config.svgHeight / 2))
                .force("collision", d3.forceCollide().radius(d => xScale(d['co2'])));

            //Append svg to each subgraphic div
            svg = d3.select(config.parentSelector)
                .append('svg')
                .attr('width', config.svgWidth)
                .attr('height', config.svgHeight);
        }
        else {
            //Smaller networks need stronger attraction and smaller divs
            simulationObj[graphicSelected.id] = d3.forceSimulation()
                .force("charge", d3.forceManyBody().strength(4))
                .force("center", d3.forceCenter().x(300 / 2).y(300 / 2))
                .force("collision", d3.forceCollide().radius(d => xScale(d['co2'])));

            //Append svg to each subgraphic div
            svg = d3.select(config.parentSelector)
                .append('svg')
                .attr('width', 300)
                .attr('height', 300);
        }
        simulationObj[graphicSelected.id].nodes(nodesDataFiltered);

        if (nodesDataFiltered.length === 0) { //For the network with no countries (ie. sufficient) append text stating that
            svg.append('text')
                .attr('x', 90)
                .attr('y', 95)
                .attr('class', 'no-countries')
                .text("No countries")
        }
        else { //Otherwise append the network itself

            //Append circles for each node in force simulation and color them
            //according to continent
            const nodes = svg.selectAll("circle")
                .data(nodesDataFiltered)
                .enter()
                .append("circle")
                .attr("r", d => {
                    return xScale(d['co2'])
                })
                .style("fill", d => {

                    if (d['country'] !== 'None') {
                        return colorScale(d['region']);

                    }
                    else {
                        return '#808080'
                    }
                })
                .on("mouseover", (event, d) => {
                    d3.select("#tooltip")
                        .transition()
                        .duration(300)
                        .style("opacity", 1)
                        .style("left", (event.pageX + 2) + "px")
                        .style("top", (event.pageY + 2) + "px")
                        .text(d.country);
                })
                .on("mouseout", (event, d) => {
                    d3.select("#tooltip")
                        .transition()
                        .style("opacity", 0);
                })
                .on("mousemove", (event, d) => {
                    d3.select("#tooltip")
                        .style("left", (event.pageX + 2) + "px")
                        .style("top", (event.pageY + 2) + "px")
                });

            //Force simulation to restart when reloaded
            simulationObj[graphicSelected.id].alpha(1).restart()

            //Adjust x and y position of nodes in each network
            simulationObj[graphicSelected.id].on("tick", (event, d) => {

                nodes.attr("cx", d => d.x)
                    .attr("cy", d => d.y);

            });
        };
    }

}




