/**
 * @param data
 */
export function drawHeatmap (data) {
  const width = 900 // Largeur du SVG
  const height = 450 // Hauteur du SVG
  const margin = { top: 50, right: 30, bottom: 50, left: 100 }

  // Sélectionner ou créer le SVG dans la div #screen
  const container = d3.select('#screen')
  container.selectAll('*').remove()
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height)

  const x = d3.scaleBand()
    .domain(d3.range(2009, 2022)) // Exemple : années de 2009 à 2021
    .range([margin.left, width - margin.right])
    .padding(0.05)

  const y = d3.scaleBand()
    .domain(data.map(d => d.category)) // Catégories des données
    .range([margin.top, height - margin.bottom])
    .padding(0.05)

  const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([0, 100]) // Exemple : pourcentage de 0 à 100

  // Ajouter les cellules du heatmap
  svg.selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', d => x(d.year))
    .attr('y', d => y(d.category))
    .attr('width', x.bandwidth())
    .attr('height', y.bandwidth())
    .attr('fill', d => colorScale(d.percentage))
    .attr('class', 'heatmap-cell')

  // Ajouter les axes
  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')))
    .selectAll('text')
    .attr('font-family', "'Bebas Neue', sans-serif")
    .attr('font-size', '12px')

  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .selectAll('text')
    .attr('font-family', "'Bebas Neue', sans-serif")
    .attr('font-size', '12px')

  // Ajouter une légende
  addHeatmapLegend(svg, colorScale, width, height, margin)
}

/**
 * Ajoute une légende pour le heatmap.
 *
 * @param svg
 * @param colorScale
 * @param width
 * @param height
 * @param margin
 */
function addHeatmapLegend (svg, colorScale, width, height, margin) {
  const legendWidth = 20
  const legendHeight = height - margin.top - margin.bottom

  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([legendHeight, 0])

  const legendAxis = d3.axisRight(legendScale)
    .ticks(5)
    .tickFormat(d3.format('d'))

  const defs = svg.append('defs')
  const gradient = defs.append('linearGradient')
    .attr('id', 'heatmap-legend-gradient')
    .attr('x1', '0%').attr('y1', '100%')
    .attr('x2', '0%').attr('y2', '0%')

  const colorStops = 10
  for (let i = 0; i <= colorStops; i++) {
    const t = i / colorStops
    gradient.append('stop')
      .attr('offset', `${t * 100}%`)
      .attr('stop-color', colorScale(legendScale.invert((1 - t) * legendHeight)))
  }

  svg.append('rect')
    .attr('x', width - margin.right + 10)
    .attr('y', margin.top)
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .style('fill', 'url(#heatmap-legend-gradient)')

  svg.append('g')
    .attr('transform', `translate(${width - margin.right + 10 + legendWidth},${margin.top})`)
    .call(legendAxis)
    .selectAll('text')
    .attr('font-family', "'Bebas Neue', sans-serif")
    .attr('font-size', '12px')
}
