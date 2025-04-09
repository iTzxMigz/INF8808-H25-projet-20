/**
 * @param chartData
 */
export function drawStackedBarChart (chartData) {
  const width = 800 // Largeur du SVG
  const height = 400 // Hauteur du SVG
  const margin = { top: 50, right: 50, bottom: 50, left: 70 }

  // Sélectionner le SVG dans la div #screen
  const svg = d3.select('#screen svg')
    .attr('width', width)
    .attr('height', height)

  const x = d3.scaleBand()
    .domain(chartData.map(d => d.year))
    .range([margin.left, width - margin.right])
    .padding(0.2)

  const y = d3.scaleLinear()
    .domain([0, d3.max(chartData, d => d.Movies + d.TVShows)])
    .nice()
    .range([height - margin.bottom, margin.top])

  const color = d3.scaleOrdinal()
    .domain(['Movies', 'TVShows'])
    .range(['#E50914', '#221F1F']) // Couleurs pour les barres

  const stack = d3.stack()
    .keys(['Movies', 'TVShows'])

  const series = stack(chartData)

  // Ajouter les barres empilées
  svg.append('g')
    .selectAll('g')
    .data(series)
    .join('g')
    .attr('fill', d => color(d.key))
    .selectAll('rect')
    .data(d => d)
    .join('rect')
    .attr('x', d => x(d.data.year))
    .attr('y', d => y(d[1]))
    .attr('height', d => y(d[0]) - y(d[1]))
    .attr('width', x.bandwidth())

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
}
