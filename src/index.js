'use strict'

import * as preproc from './scripts/preprocess.js'
import * as radarChart from './scripts/radar-chart.js'

/**
 * @file This file is the entry-point for the the code for TP3 for the course INF8808.
 * @author Olivia Gélinas
 * @version v1.0.0
 */

(function (d3) {
  d3.csv('/netflix.csv', d3.autoType).then(function(data) {
    let movies = preproc.getMoviesAndSeries(data);
    let filterMoviesSeriesByYear = preproc.getFilterMoviesSeriesByYear(movies);
    let chartData = Array.from(filterMoviesSeriesByYear, ([year, values]) => ({
      year: +year,
      Movies: values.Movies,
      TVShows: values.TVShows
    })).sort((a, b) => a.year - b.year);
    // Create shape:
    drawShape(6);
    // First graphe:
    drawStackedBarChart(chartData);
    // Second graphe
    let resultHeatmap = preproc.processCategoriesForHeatmap(movies);
    let heatmapData = resultHeatmap.heatmapData
    let categoriesList = resultHeatmap.sortedCategories
    let percentageData = preproc.processCategoryPercentage(heatmapData);
    drawHeatmap(heatmapData, percentageData);
    // Third graphe
    let radarObject = preproc.preprocessRadarChart(movies, categoriesList);
    let dataRadarChartAge = preproc.prepareRadarChartData(radarObject.radarAgeCert, "ageCert");
    let dataRadarChartCat = preproc.prepareRadarChartData(radarObject.radarCategories, "");
    radarChart.drawMultipleRadarCharts(dataRadarChartAge, true);
    radarChart.createChangingModeButton(dataRadarChartAge, dataRadarChartCat);
    
  });


})(d3)

function drawShape(numberOfGraph) {
   for (let i = 0; i < numberOfGraph; i++) {
      const div = d3.select("main")
         .append("div")
            .attr("class", "viz-container")
            .attr("id", `viz-container-${i + 1}`);
      div.append("div")
         .attr("class", "graph")
         .attr("id", `graph-${i + 1}`)
   }
}

function drawStackedBarChart(data) {
  const width = 1300, height = 500, margin = { top: 50, right: 200, bottom: 50, left: 70 };
  const svg = d3.select("#graph-1").append("svg")
                .attr("width", width)
                .attr("height", height);

  const x = d3.scaleBand()
              .domain(data.map(d => d.year))
              .range([margin.left, width - margin.right])
              .padding(0.2);

  const y = d3.scaleLinear()
              .domain([0, d3.max(data, d => d.Movies + d.TVShows)])
              .nice()
              .range([height - margin.bottom, margin.top]);

  const color = d3.scaleOrdinal()
                  .domain(["Movies", "TVShows"])
                  .range(["#E50914", "#221F1F"]); // Couleurs (bleu, orange)

  const stack = d3.stack()
                  .keys(["Movies", "TVShows"]);

  const series = stack(data);

  svg.append("g")
     .selectAll("g")
     .data(series)
     .join("g")
     .attr("fill", d => color(d.key))
     .selectAll("rect")
     .data(d => d)
     .join("rect")
     .attr("x", d => x(d.data.year))
     .attr("y", d => y(d[1]))
     .attr("height", d => y(d[0]) - y(d[1]))
     .attr("width", x.bandwidth());

  svg.append("g")
     .attr("transform", `translate(0,${height - margin.bottom})`)
     .call(d3.axisBottom(x).tickFormat(d3.format("d")))
     .selectAll("text")
     .attr("font-family", "'Bebas Neue', sans-serif")
     .attr("font-size", "18px");

  svg.append("g")
     .attr("transform", `translate(${margin.left},0)`)
     .call(d3.axisLeft(y))
     .selectAll("text")
     .attr("font-family", "'Bebas Neue', sans-serif")
     .attr("font-size", "18px");

  // Légende
  const legend = svg.append("g")
                    .attr("transform", `translate(${width -200},${margin.top})`);

  legend.selectAll("rect")
        .data(color.domain())
        .join("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", color);

  legend.selectAll("text")
        .data(color.domain())
        .join("text")
        .attr("x", 24)
        .attr("y", (d, i) => i * 20 + 14)
        .text(d => d)
        .attr("font-family", "'Bebas Neue', sans-serif")
        .attr("font-size", "18px")
        .attr("fill", "#000");
}

function drawHeatmap(data, categoryPercentages) {
  const width = 1200, height = 500, margin = { top: 50, right: 30, bottom: 50, left: 300 };
  
  const svg = d3.select("#graph-2").append("svg")
                .attr("width", width)
                .attr("height", height);

  const x = d3.scaleBand()
              .domain(d3.range(2009, 2022))
              .range([margin.left, width - margin.right])
              .padding(0.05);

  const y = d3.scaleBand()
              .domain(data.map(d => d.category))
              .range([margin.top, height - margin.bottom])
              .padding(0.05);

  const colorScale = d3.scaleSequential(d3.interpolateReds)
                       .domain([0, d3.max(data, d => d.count)]);

  svg.selectAll("rect")
  .data(data)
  .join("rect")
  .attr("x", d => x(d.year))
  .attr("y", d => {
      return y(d.category);
  })
  .attr("width", x.bandwidth())
  .attr("height", y.bandwidth()) // Ensure y.bandwidth() exists
  .attr("fill", d => colorScale(d.count))
  .attr("class", "heatmap-cell")
  .on("click", function(event, d) {
    svg.selectAll(".highlight-row").remove();

    // Get the y position of the selected category
    let yPos = y(d.category);
    let rowHeight = y.bandwidth();
    

    svg.selectAll(".tick text") // Select all Y-axis labels
   .style("font-weight", "normal") // Reset all to normal
   .style("fill", "black"); // Reset color in case it's modified
    // Add a background rectangle for the entire row
    svg.selectAll(".tick text")
   .filter(text => text === d.category) // Find the matching category
   .style("font-weight", "bold")
   .style("fill", "black");

    svg.append("rect")
       .attr("class", "highlight-row")
       .attr("x", margin.left) // Start at the beginning of the heatmap
       .attr("y", yPos)
       .attr("width", width - margin.left - margin.right - 5)
       .attr("height", rowHeight)
       .attr("fill", "none") // No fill, just a border
       .attr("stroke", "black") // Highlight color
       .attr("stroke-width", 5)
   

       let category = d.category;
       let categoryData = categoryPercentages.get(category);

       // Update the bar chart
       if (categoryData) {
           drawBarChart(category, categoryData);
       }
  });

  //Title
  svg.append("text")
   .attr("x", margin.left + (width - margin.left - margin.right) / 2) // Center the title
   .attr("y", margin.top / 2) // Position slightly above the heatmap
   .attr("text-anchor", "middle") // Ensure the text is centered
   .text("Netflix's Top 10 Content Categories Over Time (2009-2021)") // Customize this title!
   .attr("font-family", "'Bebas Neue', sans-serif") // Netflix-like font
   .attr("font-size", "30px") // Large, readable text
   .attr("fill", "black") // Text color

  // Axes
  svg.append("g")
     .attr("transform", `translate(0,${height - margin.bottom})`)
     .call(d3.axisBottom(x).tickFormat(d3.format("d")))
     .selectAll("text")
     .attr("font-family", "'Bebas Neue', sans-serif")
     .attr("font-size", "18px");

  svg.append("g")
     .attr("transform", `translate(${margin.left},0)`)
     .call(d3.axisLeft(y)).selectAll("text")
     .attr("font-family", "'Bebas Neue', sans-serif")
     .attr("font-size", "18px");


   const legendOffset = 200
   // Définition des dimensions de la légende
   const legendWidth = 20;
   const legendHeight = height - margin.top - margin.bottom;

   // Création d'une échelle de couleur linéaire basée sur `colorScale`
   const legendScale = d3.scaleLinear()
                        .domain(colorScale.domain()) // Utiliser le même domaine que le heatmap
                        .range([legendHeight, 0]); // Max en haut, min en bas (comme heatmap)

   // Créer un axe pour la légende, aligné à gauche
   const legendAxis = d3.axisLeft(legendScale)
                        .ticks(5)
                        .tickFormat(d3.format("d"));

   // Créer un gradient correspondant aux couleurs du heatmap
   const defs = svg.append("defs");
   const gradient = defs.append("linearGradient")
                        .attr("id", "legend-gradient")
                        .attr("x1", "0%").attr("y1", "100%")  // INVERSION DU GRADIENT
                        .attr("x2", "0%").attr("y2", "0%");

   // Ajouter les stops du gradient basés sur `colorScale`
   const colorStops = 10; // Nombre de stops pour le dégradé
   for (let i = 0; i <= colorStops; i++) {
   const t = i / colorStops;
   gradient.append("stop")
            .attr("offset", `${t * 100}%`)
            .attr("stop-color", colorScale(legendScale.invert((1 - t) * legendHeight))); // Inversion
   }

   // Dessiner le rectangle de la légende à GAUCHE du heatmap
   svg.append("rect")
      .attr("x", margin.left - legendOffset) // Positionner à gauche du heatmap
      .attr("y", margin.top)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

   // Ajouter l'axe de la légende
   svg.append("g")
      .attr("transform", `translate(${margin.left - legendOffset},${margin.top})`) // Aligner à gauche
      .call(legendAxis)
      .selectAll("text")
      .attr("font-family", "'Bebas Neue', sans-serif")
      .attr("font-size", "18px");

   svg.append("text")
      .attr("x", margin.left - legendOffset + legendWidth/2)
      .attr("y", margin.top - 20)
      .attr("text-anchor", "middle")
      .text("Number of Movies & TV Shows")
      .attr("font-family", "'Bebas Neue', sans-serif")
      .attr("font-size", "16px")
      .attr("fill", "black")

}

function drawBarChart(category, data) {
  d3.select("#barchart").selectAll("*").remove(); // Efface l'ancien graphique

  const width = 800, height = 500, margin = { top: 50, right: 30, bottom: 50, left: 50 };

  const svg = d3.select("#barchart").append("svg")
                .attr("width", width)
                .attr("height", height);

  const x = d3.scaleBand()
              .domain(data.map(d => d.year).sort((a, b) => a - b))
              .range([margin.left, width - margin.right])
              .padding(0.1);

  const y = d3.scaleLinear()
              .domain([0, 90])
              .nice()
              .range([height - margin.bottom, margin.top]);

  svg.append("g")
     .selectAll("rect")
     .data(data)
     .join("rect")
     .attr("x", d => x(d.year))
     .attr("y", d => y(d.percentage))
     .attr("height", d => height - margin.bottom - y(d.percentage))
     .attr("width", x.bandwidth())
     .attr("fill", "#E50914");

  svg.append("g")
     .attr("transform", `translate(0,${height - margin.bottom})`)
     .call(d3.axisBottom(x).tickFormat(d3.format("d")))
     .selectAll("text")
     .attr("font-family", "'Bebas Neue', sans-serif")
     .attr("font-size", "18px");

  svg.append("g")
     .attr("transform", `translate(${margin.left},0)`)
     .call(d3.axisLeft(y))
     .selectAll("text")
     .attr("font-family", "'Bebas Neue', sans-serif")
     .attr("font-size", "18px");

  svg.append("text")
     .attr("x", width / 2)
     .attr("y", margin.top / 2)
     .attr("text-anchor", "middle")
     .text(`% of ${category} categories by year`)
     .attr("font-family", "'Bebas Neue', sans-serif")
     .attr("font-size", "30px")
     .attr("fill", "black");
}


