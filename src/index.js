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
  hideTooltip()
  d3.select('.info-container p').text("Let's take a look at the volume of content added to Netflix each year, distinguishing between movies and series. There was a clear acceleration after 2015, marking a strategy of catalog diversification. The platform's expansion period also marks the start of a new craze for series. At this time, the first exclusive series arrived on the platform, the American drama House of Cards.")
  d3.select('.bottom-bar h1').text('Movies and Series added to Netflix by year')
  d3.select('#table-container').classed('active', false)
  drawStackedBarChart(chartData)
}

/**
 *
 */
function callFunction2 () {
  hideTooltip()
  d3.select('.info-container p').text("With regard to the evolution of the most represented genres from 2009 to 2021, it highlights the dominant trends with the rise of drama or comedy, and helps to anticipate successful genres. It's the “international” category that brings together the most content, revealing that the platform enables films from all over the world to be showcased.")
  d3.select('.bottom-bar h1').text('Distribution of categories per year on Netflix')
  const container = d3.select('#button-container')
  container.selectAll('*').remove()
  d3.select('#table-container').classed('active', false)
  drawHeatmap(heatmapData)
}

/**
 *
 */
function callFunction3 () {
  hideTooltip()
  d3.select('#scroll-down-animation').style('display', 'block')
  d3.select('.info-container p').text("Let's compare the dominant categories by country, highlighting cultural specificities in terms of production. This allows us to identify the thematic strengths of each country, and to direct purchasing or local production strategies according to cultural expectations. This targeting refines our international offering. By changing indicators, we can observe the audiences targeted by age rattings.")
  d3.select('.info-container p').append('ul')
    .selectAll('li')
    .data([
      'Rated G: General audiences – All ages admitted',
      'Rated PG: Parental guidance suggested',
      'Rated PG-13: Parents strongly cautioned',
      'Rated R: Restricted – Under 17 requires accompanying parent or adult guardian',
      'Rated NC-17: No Children Under 17 Admitted'
    ])
    .enter()
    .append('li')
    .text(d => d)
  d3.select('.bottom-bar h1').text('Distribution of Age Ratings by Country')
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
  hideTooltip()
  d3.select('.info-container p').text("These proportional circles show the total number of films and series per country. We can pinpoint the most productive geographical areas and enhance the diversity of the catalog. This can be seen as an opportunity to explore new, under-represented markets, or to strengthen existing partnerships.")
  d3.select('.bottom-bar h1').text('Content Production and IMDb Scores by Country on Netflix')
  const container = d3.select('#button-container')
  container.selectAll('*').remove()
  d3.select('#table-container').classed('active', true)
  geomap.drawGeomap(movies)

  // Masquer l'élément scroll-down-animation
  d3.select('#scroll-down-animation').style('display', 'none')
  // Empêcher la propagation du scroll global lorsque l'utilisateur interagit avec le tableau
  const tableContainer = document.getElementById('table-container')
  const stopScrollPropagation = function (event) {
    event.stopPropagation() // Empêche la propagation de l'événement de scroll
  }

  // Ajouter l'écouteur uniquement si la classe "active" est présente
  if (d3.select('#table-container').classed('active')) {
    tableContainer.addEventListener('wheel', stopScrollPropagation)
  }

  // Supprimer l'écouteur lorsque la classe "active" est retirée
  const observer = new MutationObserver(() => {
    if (!d3.select('#table-container').classed('active')) {
      tableContainer.removeEventListener('wheel', stopScrollPropagation)
      observer.disconnect() // Arrêter d'observer les mutations
    }
  })

  // Observer les changements de classe sur le conteneur
  observer.observe(tableContainer, { attributes: true, attributeFilter: ['class'] })
}

/**
 *
 */
function callFunction5 () {
  hideTooltip()
  d3.select('.info-container p').text('Finally, the distribution of IMDb scores by genre can guide the choice of new content. The IMDb score, awarded by users, is an indicator of satisfaction and perceived quality. Select the indicator and the category to observe the results in detail. This will reveal which categories are most appreciated by the public, and give you an idea of the age range of the target audience for each category, so that you can adapt your marketing and advertising choices.')
  d3.select('.bottom-bar h1').text('IMDB Scores by Category')
  d3.select('#table-container').classed('active', false)
  const container = d3.select('#button-container')
  container.selectAll('*').remove()
  stackDotPlot.initDropdownAndPlot(dataStackedDotPlot.categories, dataStackedDotPlot.data)
}

// Fonction de gestion du scroll
let virtualScrollPosition = 0 // Position virtuelle du scroll
const maxScroll = 3500 // Longueur totale du faux scroll

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
  illuminateSeatsOnScroll(virtualScrollPosition)
}

// Variable pour suivre la dernière fonction appelée
let lastFunctionIndex = -1 // -1 signifie qu'aucune fonction n'a été appelée encore

/**
 * @param scrollPosition
 */
function updateContentBasedOnScroll (scrollPosition) {
  const thresholds = [0, 875, 1750, 2625, 3500] // Seuils pour les différentes fonctions

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
window.addEventListener('wheel', handleScroll)

export function drawShape () {
  const width = 1000 // Largeur du SVG
  const height = 400 // Hauteur du SVG

  // Sélectionner la div avec l'ID "screen" et y ajouter un SVG
  d3.select('#screen')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
}

// Tableau global pour suivre les sièges déjà éclairés
const litSeats = new Set()

function illuminateSeatsOnScroll(scrollPosition) {
  const seats = Array.from(document.querySelectorAll('.seat')) // Récupérer tous les sièges
  const totalSeats = seats.length

  // Générer un ordre pseudo-aléatoire pour les sièges (une seule fois)
  if (!window.randomOrder) {
    window.randomOrder = [...Array(totalSeats).keys()].sort(() => Math.random() - 0.5)
  }

  // Calculer la progression du scroll
  const progress = Math.min(scrollPosition / maxScroll, 1) // Progression entre 0 et 1

  // Déterminer combien de sièges doivent être éclairés
  const seatsToLight = Math.floor(progress * totalSeats)

  // Éclairer ou assombrir les sièges selon l'ordre pseudo-aléatoire
  seats.forEach((seat, index) => {
    const seatIndex = window.randomOrder.indexOf(index)
    if (seatIndex < seatsToLight && !litSeats.has(index)) {
      seat.classList.add('lit') // Ajouter la classe "lit"
      litSeats.add(index) // Marquer le siège comme éclairé
    } else if (seatIndex >= seatsToLight && litSeats.has(index)) {
      seat.classList.remove('lit') // Retirer la classe "lit"
      litSeats.delete(index) // Marquer le siège comme assombri
    }
  })
}

// Fonction pour masquer le tooltip
function hideTooltip () {
  console.log('Masquer le tooltip')
  d3.selectAll('div')
    .filter(function () {
      // Filtrer les divs avec les styles spécifiques du tooltip
      return this.style.position === 'absolute' &&
             this.style.background === 'rgb(20, 20, 20)' &&
             this.style.color === 'rgb(255, 255, 255)' &&
             this.style.border === '3px solid rgb(229, 9, 20)'
    })
    .style('opacity', 0) // Masquer le tooltip
}