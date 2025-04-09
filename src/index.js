'use strict'

import * as preproc from './scripts/preprocess.js'
import * as radarChart from './scripts/radar-chart.js'
import { drawStackedBarChart } from './scripts/stack-barchart.js'
import { drawHeatmap } from './scripts/heatmap.js'
import * as geomap from './scripts/geomap.js'
import * as stackDotPlot from './scripts/stacked-dot-plot.js'

/**
 * @file This file is the entry-point for the the code for Projet for the course INF8808.
 * @author Team Projet 20
 * @version v1.0.0
 */

/**
 * @param numberOfGraph
 */
(function (d3) {
  d3.csv('/netflix.csv', d3.autoType).then(function (data) {
    const movies = preproc.getMoviesAndSeries(data)
    const filterMoviesSeriesByYear = preproc.getFilterMoviesSeriesByYear(movies)
    const chartData = Array.from(filterMoviesSeriesByYear, ([year, values]) => ({
      year: +year,
      Movies: values.Movies,
      TVShows: values.TVShows
    })).sort((a, b) => a.year - b.year)
    drawShape()
    // drawStackedBarChart(chartData)
    const resultHeatmap = preproc.processCategoriesForHeatmap(movies, filterMoviesSeriesByYear)
    const heatmapData = resultHeatmap.heatmapData
    const categoriesList = resultHeatmap.sortedCategories
    const dataStackedDotPlot = preproc.prepareStackedDotPlotData(movies)
    // drawHeatmap(heatmapData)
    const radarObject = preproc.preprocessRadarChart(movies, categoriesList)
    const dataRadarChartAge = preproc.prepareRadarChartData(radarObject.radarAgeCert, 'ageCert')
    const dataRadarChartCat = preproc.prepareRadarChartData(radarObject.radarCategories, '')
    // radarChart.createChangingModeButton(dataRadarChartAge, dataRadarChartCat)
    // radarChart.drawMultipleRadarCharts(dataRadarChartAge, true)

    // d3.select('#table-container').classed('active', true)
    // geomap.drawGeomap(movies)
    // d3.select('#table-container').classed('active', false)

    stackDotPlot.initDropdownAndPlot(dataStackedDotPlot.categories, dataStackedDotPlot.data)
  })
})(d3)

export function drawShape () {
  const width = 800 // Largeur du SVG
  const height = 400 // Hauteur du SVG

  // Sélectionner la div avec l'ID "screen" et y ajouter un SVG
  d3.select('#screen')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
}
