'use strict';

let data = "no data"
let allGenData = "no data"
let svgScatterPlot = "" // keep SVG reference in global scope
let funcs = "" // scaling and mapping functions
let dropDownGen = ""
let dropDownLeg = ""
let leg="(all)"
let gen=1

const m = {
    lw: 800,
    width: 500,
    height: 500,
    marginAll: 50
}

const colors = {
    "Bug": "#4E79A7",
    "Dark": "#A0CBE8",
    "Electric": "#F28E2B",
    "Fairy": "#FFBE&D",
    "Fighting": "#59A14F",
    "Fire": "#8CD17D",
    "Ghost": "#B6992D",
    "Grass": "#499894",
    "Ground": "#86BCB6",
    "Ice": "#86BCB6",
    "Normal": "#E15759",
    "Poison": "#FF9D9A",
    "Psychic": "#79706E",
    "Steel": "#BAB0AC",
    "Water": "#D37295"
}


// load data and make scatter plot after window loads
svgScatterPlot = d3.select('body')
  .append('svg')
  .attr('width', m.lw)
  .attr('height', m.height)

// d3.csv is basically fetch but it can be be passed a csv file as a parameter
d3.csv("pokemon.csv")
  .then((csvData) => {
    csvData.sort(function(a, b) { return d3.ascending(a["Type 1"], b["Type 1"]); });


    data = csvData
    allGenData = csvData
    funcs = makeAxesAndLabels()

    //generation dropdown menu
    dropDownGen = d3.select("body").append("div")
    .attr("id", "filterGen")
    .append("b")
    .text("Generation: ")
    .append("select")
    .attr("name", "generation");

    //add (all) option to the dropdown list
    var optionList = ["(all)"]
    optionList=optionList.concat(d3.map(allGenData,function(d) {return d.Generation;}).keys())

    //add generation to the dropdown menue
    var options = dropDownGen.selectAll("option")
        .data(optionList)
        .enter()
        .append("option");

    options.text(function (d) { return d;})
        .attr("value", function (d) { return d;})
        .property("selected", function(d){ return d === "1"; })

    //legendary dropdown menu
     dropDownLeg = d3.select("body").append("div")
      .attr("id", "filterLeg")
      .append("b")
      .text("Legendary: ")
      .append("select")
      .attr("name", "legendary");

     var optionList2 = ["(all)"]
     optionList2=optionList2.concat(d3.map(allGenData,function(d) {return d.Legendary;}).keys())
     
     var options2 = dropDownLeg.selectAll("option")
        .data(optionList2)
        .enter()
        .append("option");

     options2.text(function (d) { return d;})
          .attr("value", function (d) { return d;})
          .property("selected", function(d){ return d === "(all)"; })

    // makeScatterPlot(1, "(all)", funcs) // initial scatter plot
})
.then(() => {
    makeScatterPlot(gen,leg,funcs);
    svgScatterPlot.selectAll('circle').exit().remove();
    //generation filter action
    dropDownGen.on("change", function() {
      gen=this.value;
      makeScatterPlot(gen,leg,funcs);
    })
    //legendary filter action
    dropDownLeg.on("change", function() {
      leg=this.value;
      makeScatterPlot(gen,leg,funcs);
    })
    
    


})

function makeAxesAndLabels() {
    // get Sp.Def and Total arrays
    const spDef = data.map((row) => parseFloat(row["Sp. Def"]))
    const total = data.map((row) => parseFloat(row["Total"]))

    // find limits of data
    const limits = findMinMax(spDef, total)

    // draw axes and return scaling + mapping functions
    const funcs = drawAxes(limits, "Sp. Def", "Total", svgScatterPlot, 
        {min: m.marginAll, max: m.width - m.marginAll}, {min: m.marginAll, max: m.height - m.marginAll})

    // draw title and axes labels
    makeLabels()
    makeColor()

    return funcs
}

function makeColor(){
  svgScatterPlot.append("text")
      .attr("x", 500)
      .attr("y", 55)
      .style("font-weight", "bold")
      .style("font-size", 16)
      .text("Type1")

  let i=1;
  for (var key in colors) {
     svgScatterPlot.append("rect")
      .attr("x", 500)
      .attr("y", 50+i*20)
      .attr("height", 12 )
      .attr("width", 25)
      .text(key)
      .style("fill",  colors[key]);

      svgScatterPlot.append("text")
      .attr("x", 530)
      .attr("y", 60+i*20)
      .text(key)
    i=i+1
  }
}
  

// make scatter plot with trend line
function makeScatterPlot(generation, legendary, funcs) {
  //filter
  filterAll(generation,legendary)
  // plot data as points and add tooltip functionality
  plotData(funcs)

}

function filterAll(generation, legendary) {
  if (generation!="(all)") {
    data = allGenData.filter((row) => row['Generation'] == generation);
    if (legendary!="(all)") {
      data = data.filter((row) => row['Legendary'] == legendary);
    } 
  } else {
    data = allGenData;
    if (legendary!="(all)") {
      data = data.filter((row) => row['Legendary'] == legendary);
    } 
  }
}


// make title and axes labels
function makeLabels() {
  svgScatterPlot.append('text')
    .attr('x', 50)
    .attr('y', 30)
    .attr('id', "title")
    .style('font-size', '14pt')
    .text("Pokemon: Sepcial Defense vs Total Stats")

  svgScatterPlot.append('text')
    .attr('x', 130)
    .attr('y', 490)
    .attr('id', "x-label")
    .style('font-size', '10pt')
    .text('Sp. Def')

  svgScatterPlot.append('text')
    .attr('transform', 'translate(15, 300)rotate(-90)')
    .style('font-size', '10pt')
    .text('Total')
}

// plot all the data points on the SVG
// and add tooltip functionality
function plotData(map) {

  // mapping functions
  let xMap = map.x
  let yMap = map.y

  // make tooltip
  let div = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .attr("width", 60)
  .attr("height", 60)
  // .attr("text-align", left)

  /*******************************************************
   * Enter, Update, Exit pattern
   *******************************************************/
  // reference to the start of our update
  // append new data to existing points
  let update = svgScatterPlot.selectAll('circle')
    .data(data)

  // add new circles
  update
    .enter()
    .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 5)
      .style("fill", function(d) { return colors[d["Type 1"]]; })
      // add tooltip functionality to points
      .on("mouseover", (d) => {
        var type1=d["Type 1"]? d["Type 1"]: "N/A"
        var type2=d["Type 2"]? d["Type 2"]: "N/A"
        div.transition()
          .duration(200)
          .style("opacity", .9)
        div.html("Name: " + d.Name + "<br/>"
          + "Type 1: " + type1 + "<br/>"
          + "Type 2: "+ type2)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px")         
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0)
      })

  update.exit().remove() // remove old elements
  
  // animate the update
  // note: new elements CANNOT be animated
  update.transition().duration(500)
    .attr('cx', xMap)
    .attr('cy', yMap)
  
  /*******************************************
   * Enter, Update, Exit end
   ******************************************/
}


function legendMap(i) {
  return {
    x:400,
    y:20+i*30
  }
}

// draw the axes and ticks
// x -> the name of the field on the x axis
// y -> the name of the field on the y axis
// svg -> the svgContainer to draw on
// rangeX -> and object of the form {min: yourXMinimum, max: yourXMaximum}
// rangeY -> and object of the form {min: yourYMinimum, max: yourYMaximum}
function drawAxes(limits, x, y, svg, rangeX, rangeY) {
  // return x value from a row of data
  let xValue = function(d) { return +d[x] }

  // function to scale x value
  let xScale = d3.scaleLinear()
    .domain([limits.xMin, limits.xMax]) // give domain buffer room
    .range([rangeX.min, rangeX.max])

  // xMap returns a scaled x value from a row of data
  let xMap = function(d) { return xScale(xValue(d)) }

  // plot x-axis at bottom of SVG
  let xAxis = d3.axisBottom().scale(xScale)
  svg.append("g")
    .attr('transform', 'translate(0, ' + rangeY.max + ')')
    .attr('id', "x-axis")
    .call(xAxis)

  // return y value from a row of data
  let yValue = function(d) { return +d[y]}

  // function to scale y
  let yScale = d3.scaleLinear()
    .domain([limits.yMax, limits.yMin]) // give domain buffer
    .range([rangeY.min, rangeY.max])

  // yMap returns a scaled y value from a row of data
  let yMap = function (d) { return yScale(yValue(d)) }

  // plot y-axis at the left of SVG
  let yAxis = d3.axisLeft().scale(yScale)
  svg.append('g')
    .attr('transform', 'translate(' + rangeX.min + ', 0)')
    .attr('id', "y-axis")
    .call(yAxis)

  // return mapping and scaling functions
  return {
    x: xMap,
    y: yMap,
    xScale: xScale,
    yScale: yScale
  }
}

// find min and max for arrays of x and y
function findMinMax(x, y) {

  // get min/max x values
  let xMin = d3.min(x)
  let xMax = d3.max(x)

  // get min/max y values
  let yMin = d3.min(y)
  let yMax = d3.max(y)

  // return formatted min/max data as an object
  return {
    xMin : xMin,
    xMax : xMax,
    yMin : yMin,
    yMax : yMax
  }
}

// format numbers
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
