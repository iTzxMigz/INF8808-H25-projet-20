'use strict'

import * as preproc from './scripts/preprocess.js'
import * as radarChart from './scripts/radar-chart.js'
import { drawStackedBarChart } from './scripts/stack-barchart.js'
import { drawHeatmap } from './scripts/heatmap.js'
import * as geomap from './scripts/geomap.js'
import * as stackDotPlot from './scripts/stacked-dot-plot.js'

let chartData, heatmapData, dataRadarChartAge, dataRadarChartCat, movies, dataStackedDotPlot;

// Fonction principale
(function (d3) {
  d3.csv('/netflix.csv', d3.autoType).then(function (data) {
    movies = preproc.getMoviesAndSeries(data)
    const filterMoviesSeriesByYear = preproc.getFilterMoviesSeriesByYear(movies)
    chartData = Array.from(filterMoviesSeriesByYear, ([year, values]) => ({
      year: +year,
      Movies: values.Movies,
      TVShows: values.TVShows
    })).sort((a, b) => a.year - b.year)

    drawShape()

    const resultHeatmap = preproc.processCategoriesForHeatmap(movies, filterMoviesSeriesByYear)
    heatmapData = resultHeatmap.heatmapData
    const categoriesList = resultHeatmap.sortedCategories

    dataStackedDotPlot = preproc.prepareStackedDotPlotData(movies)
    const radarObject = preproc.preprocessRadarChart(movies, categoriesList)
    dataRadarChartAge = preproc.prepareRadarChartData(radarObject.radarAgeCert, 'ageCert')
    dataRadarChartCat = preproc.prepareRadarChartData(radarObject.radarCategories, '')

    // Ajouter un écouteur d'événement pour le scroll
    window.addEventListener('scroll', handleScroll)
    callFunction1() // Appeler la première fonction au chargement de la page
  })
})(d3)

// Sous-fonctions accessibles globalement
/**
 *
 */
function callFunction1 () {
  d3.select('#table-container').classed('active', false)
  drawStackedBarChart(chartData)
}

/**
 *
 */
function callFunction2 () {
  const container = d3.select('#button-container')
  container.selectAll('*').remove()
  d3.select('#table-container').classed('active', false)
  drawHeatmap(heatmapData)
}

/**
 *
 */
function callFunction3 () {
  const container = d3.select('#button-container')
  container.selectAll('*').remove()
  d3.select('#table-container').classed('active', false)
  radarChart.createChangingModeButton(dataRadarChartAge, dataRadarChartCat)
  radarChart.drawMultipleRadarCharts(dataRadarChartAge, true)
}

/**
 *
 */
function callFunction4 () {
  const container = d3.select('#button-container')
  container.selectAll('*').remove()
  d3.select('#table-container').classed('active', true)
  geomap.drawGeomap(movies)
}

/**
 *
 */
function callFunction5 () {
  d3.select('#table-container').classed('active', false)
  const container = d3.select('#button-container')
  container.selectAll('*').remove()
  stackDotPlot.initDropdownAndPlot(dataStackedDotPlot.categories, dataStackedDotPlot.data)
}

// Fonction de gestion du scroll
let virtualScrollPosition = 0 // Position virtuelle du scroll
const maxScroll = 1000 // Longueur totale du faux scroll

/**
 * @param event
 */
function handleScroll (event) {
  // Détecter la direction du scroll
  if (event.deltaY > 0 && virtualScrollPosition < maxScroll) {
    virtualScrollPosition += 20 // Scroller vers le bas
  } else if (event.deltaY < 0 && virtualScrollPosition > 0) {
    virtualScrollPosition -= 20 // Scroller vers le haut
  }

  // Limiter la position virtuelle entre 0 et maxScroll
  virtualScrollPosition = Math.max(0, Math.min(virtualScrollPosition, maxScroll))

  // Appeler les fonctions en fonction de la position virtuelle
  updateContentBasedOnScroll(virtualScrollPosition)
}

// Variable pour suivre la dernière fonction appelée
let lastFunctionIndex = -1 // -1 signifie qu'aucune fonction n'a été appelée encore

/**
 * @param scrollPosition
 */
function updateContentBasedOnScroll (scrollPosition) {
  const thresholds = [0, 200, 400, 600, 800] // Seuils pour les différentes fonctions

  // Déterminer l'index de la fonction à appeler en fonction de la position du scroll
  let currentFunctionIndex = -1
  for (let i = 0; i < thresholds.length; i++) {
    if (scrollPosition >= thresholds[i] && (i === thresholds.length - 1 || scrollPosition < thresholds[i + 1])) {
      currentFunctionIndex = i
      break
    }
  }

  // Si l'index actuel est différent de l'index précédent, appeler la fonction correspondante
  if (currentFunctionIndex !== lastFunctionIndex) {
    lastFunctionIndex = currentFunctionIndex // Mettre à jour l'index précédent

    // Appeler la fonction correspondante
    switch (currentFunctionIndex) {
      case 0:
        callFunction1()
        break
      case 1:
        callFunction2()
        break
      case 2:
        callFunction3()
        break
      case 3:
        callFunction4()
        break
      case 4:
        callFunction5()
        break
      default:
        console.log('Aucune fonction à appeler')
    }
  }
}

// Ajouter un écouteur pour la molette de la souris
window.addEventListener/**
wwwwwwwwwwwwwwwwwwwwwww *
wwwwwwwwwwwwwwwwwwwwwww */
('wheel', handleScroll)

export function drawShape () {
  const width = 1000 // Largeur du SVG
  const height = 400 // Hauteur du SVG

  // Sélectionner la div avec l'ID "screen" et y ajouter un SVG
  d3.select('#screen')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
}
