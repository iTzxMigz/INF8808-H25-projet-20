'use strict'

import * as preproc from './scripts/preprocess.js'
import * as radarChart from './scripts/radar-chart.js'
import * as stackBarChart from './scripts/stack-barchart.js'
import * as heatmap from './scripts/heatmap.js'
import * as geomap from './scripts/geomap.js'

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
    drawShape(6);
    stackBarChart.drawStackedBarChart(chartData);
    let resultHeatmap = preproc.processCategoriesForHeatmap(movies, filterMoviesSeriesByYear);
    let heatmapData = resultHeatmap.heatmapData
    let categoriesList = resultHeatmap.sortedCategories
    heatmap.drawHeatmap(heatmapData);
    let radarObject = preproc.preprocessRadarChart(movies, categoriesList);
    let dataRadarChartAge = preproc.prepareRadarChartData(radarObject.radarAgeCert, "ageCert");
    let dataRadarChartCat = preproc.prepareRadarChartData(radarObject.radarCategories, "");
    radarChart.createChangingModeButton(dataRadarChartAge, dataRadarChartCat);
    radarChart.drawMultipleRadarCharts(dataRadarChartAge, true);
    geomap.drawGeomap(movies);
    changingTitleDynamically();
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

function changingTitleDynamically() {
  const headerTitle = d3.select("header h1");

let titlesByViz = {
  "viz-container-1": "Movies and Series added to Netflix by year",
  "viz-container-2": "Distribution of Categories per year on Netflix",
  "viz-container-3": () => radarChart.isAgeCertMode? radarChart.titleAgerCert : radarChart.titleCategories,
  "viz-container-4": "C'est le temps de WAKE UP!!!",
  // ajoute d'autres si tu veux
};

window.addEventListener("scroll", () => {
  d3.selectAll(".viz-container").each(function() {
    const rect = this.getBoundingClientRect();
    const height = window.innerHeight

    if (rect.top < height / 4 && rect.bottom > height - height / 4) {
      const id = this.id;
      const title = typeof titlesByViz[id] === "function"
      ? titlesByViz[id]()
      : titlesByViz[id];
      if (title) {
        headerTitle.text(title);
      }
    }
  });
});

}
