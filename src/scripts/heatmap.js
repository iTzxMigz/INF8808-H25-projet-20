/**
 * @param data
 */
export function drawHeatmap (data) {
  const width = 900; const height = 450; const margin = { top: 50, right: 30, bottom: 50, left: 300 }

  const container = d3.select('#screen')
  container.selectAll('*').remove()
  const svg = container.append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width', '100%')
    .style('height', '100%')

  const x = d3.scaleBand()
    .domain(d3.range(2009, 2022))
    .range([margin.left, width - margin.right])
    .padding(0.05)

  const y = d3.scaleBand()
    .domain(data.map(d => d.category))
    .range([margin.top, height - margin.bottom])
    .padding(0.05)

  const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([0, 100])

  const tooltip = d3.select('body')
    .append('div')
    .style('position', 'absolute')
    .style('background', '#141414')
    .style('color', '#fff')
    .style('border', '3px solid #e50914')
    .style('padding', '12px 16px')
    .style('border-radius', '4px')
    .style('box-shadow', '0 2px 8px rgba(0,0,0,0.8)')
    .style('font-family', "'Helvetica Neue', Helvetica, Arial, sans-serif")
    .style('font-size', '14px')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('z-index', 10)
    .style('transition', 'opacity 0.2s ease')

  svg.selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', d => x(d.year))
    .attr('y', d => {
      return y(d.category)
    })
    .attr('width', x.bandwidth())
    .attr('height', y.bandwidth()) // Ensure y.bandwidth() exists
    .attr('fill', d => colorScale(d.percentage))
    .attr('class', 'heatmap-cell')
    .on('mouseover', function (event, d) {
      d3.select(this)
        .style('stroke', 'black')
        .style('stroke-width', 2)
      tooltip.transition().duration(100).style('opacity', 0.9)
      tooltip.html(`
       Year: ${d.year}<br>
       Category: ${d.category}<br>
       Count: ${d.count} titles<br>
       Total: ${d.total} titles<br>
       Percentage: ${(d.percentage).toFixed(1)}%
     `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px')
        .style('font-family', 'Bebas Neue')
        .style('font-size', '18px')
    })
    .on('mousemove', function (event) {
      tooltip.style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px')
    })
    .on('mouseout', function (event, d) {
      d3.select(this)
        .style('stroke', 'none')
      tooltip.transition().duration(50).style('opacity', 0)
    })

  // Axes
  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')))
    .selectAll('text')
    .attr('font-family', "'Bebas Neue', sans-serif")
    .attr('font-size', '18px')

  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y)).selectAll('text')
    .attr('font-family', "'Bebas Neue', sans-serif")
    .attr('font-size', '18px')

  const legendOffset = 200
  // Définition des dimensions de la légende
  const legendWidth = 20
  const legendHeight = height - margin.top - margin.bottom

  // Création d'une échelle de couleur linéaire basée sur `colorScale`
  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain()) // Utiliser le même domaine que le heatmap
    .range([legendHeight, 0]) // Max en haut, min en bas (comme heatmap)

  // Créer un axe pour la légende, aligné à gauche
  const legendAxis = d3.axisLeft(legendScale)
    .ticks(5)
    .tickFormat(d3.format('d'))

  // Créer un gradient correspondant aux couleurs du heatmap
  const defs = svg.append('defs')
  const gradient = defs.append('linearGradient')
    .attr('id', 'legend-gradient')
    .attr('x1', '0%').attr('y1', '100%') // INVERSION DU GRADIENT
    .attr('x2', '0%').attr('y2', '0%')

  // Ajouter les stops du gradient basés sur `colorScale`
  const colorStops = 10 // Nombre de stops pour le dégradé
  for (let i = 0; i <= colorStops; i++) {
    const t = i / colorStops
    gradient.append('stop')
      .attr('offset', `${t * 100}%`)
      .attr('stop-color', colorScale(legendScale.invert((1 - t) * legendHeight))) // Inversion
  }

  // Dessiner le rectangle de la légende à GAUCHE du heatmap
  svg.append('rect')
    .attr('x', margin.left - legendOffset) // Positionner à gauche du heatmap
    .attr('y', margin.top)
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .style('fill', 'url(#legend-gradient)')

  // Ajouter l'axe de la légende
  svg.append('g')
    .attr('transform', `translate(${margin.left - legendOffset},${margin.top})`) // Aligner à gauche
    .call(legendAxis)
    .selectAll('text')
    .attr('font-family', "'Bebas Neue', sans-serif")
    .attr('font-size', '18px')

  svg.append('text')
    .attr('x', margin.left - legendOffset + legendWidth / 2)
    .attr('y', margin.top - 20)
    .attr('text-anchor', 'middle')
    .text('Proportion of Movies & TV Shows')
    .attr('font-family', "'Bebas Neue', sans-serif")
    .attr('font-size', '16px')
    .attr('fill', 'black')
}

/**
 * @param category
 * @param data
 */
function drawBarChart (category, data) {
  d3.select('#barchart').selectAll('*').remove() // Efface l'ancien graphique

  const width = 800; const height = 500; const margin = { top: 50, right: 30, bottom: 50, left: 50 }

  const svg = d3.select('#barchart').append('svg')
    .attr('width', width)
    .attr('height', height)

  const x = d3.scaleBand()
    .domain(data.map(d => d.year).sort((a, b) => a - b))
    .range([margin.left, width - margin.right])
    .padding(0.1)

  const y = d3.scaleLinear()
    .domain([0, 90])
    .nice()
    .range([height - margin.bottom, margin.top])

  svg.append('g')
    .selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', d => x(d.year))
    .attr('y', d => y(d.percentage))
    .attr('height', d => height - margin.bottom - y(d.percentage))
    .attr('width', x.bandwidth())
    .attr('fill', '#E50914')

  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')))
    .selectAll('text')
    .attr('font-family', "'Bebas Neue', sans-serif")
    .attr('font-size', '18px')

  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .selectAll('text')
    .attr('font-family', "'Bebas Neue', sans-serif")
    .attr('font-size', '18px')

  svg.append('text')
    .attr('x', width / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .text(`% of ${category} categories by year`)
    .attr('font-family', "'Bebas Neue', sans-serif")
    .attr('font-size', '30px')
    .attr('fill', 'black')
}
