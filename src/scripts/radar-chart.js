export function createChangingModeButton(dataRadarChartAge, dataRadarChartCat) {
    let isAgeCertMode = true;
    let currentSort = 'country';
    let ascending = true;
    const div = d3.select('#viz-container-3')
      .insert('div', function() { return this.firstChild; })
      .style('width', '100%')
      .style('margin','10px 0px')
      
      div.append('button')
      .attr('id','radar-toggle-btn')
      .attr('class', 'toolbar-btn')
      .style('margin-right', '10px')
      .text('Switch to Categories');
      
      const dropdown = div.append('div')
        .attr('class', 'dropdown')
        
      dropdown.append('button')
        .attr('id', 'dropdown-btn')
        .attr('class', 'toolbar-btn')
        .text(getSortLabel(currentSort, ascending))
        .on('click', function () {
          ascending = !ascending;
          d3.select(this).text(getSortLabel(currentSort, ascending));
        });

    const dropdownContent = dropdown.append('div')
    .attr('id', 'dropdown-content')
    .attr('class', 'dropdown-content')
    .style('display', 'none');


    [
      { label: 'Country Name', value: 'country' },
      { label: 'Total Value', value: 'total' },
      { label: 'First Axis', value: 'axis0' }
    ].forEach(option => {
      dropdownContent.append('p')
        .attr('class', 'dropdown-option')
        .text(option.label)
        .on('click', () => {
          currentSort = option.value;
          // Ferme le menu après sélection
          d3.select('#dropdown-content').style('display', 'none');
          d3.select('#dropdown-btn').text(getSortLabel(currentSort, ascending));
        });
    });


    // Toggle menu visibility on click
    d3.select('.dropdown')
      .on('mouseenter', () => {
        d3.select('#dropdown-content').style('display', 'block');
      })
      .on('mouseleave', () => {
        d3.select('#dropdown-content').style('display', 'none');
      });

        d3.select("#radar-toggle-btn").on("click", () => {
          isAgeCertMode = !isAgeCertMode;
    
          d3.select("#radar-toggle-btn").text(
              isAgeCertMode ? "Switch to Categories" : "Switch to Age Ratings"
          );
          const data = isAgeCertMode ? dataRadarChartAge : dataRadarChartCat;
          drawMultipleRadarCharts(data, isAgeCertMode);
        });
}

 export function drawMultipleRadarCharts(data, isAgeCert) {
    const width = 170, height = 170, padding = 40;
    const radius = Math.min(width, height) / 2 - padding;
    const levels = 5;
    const color = '#E50914';
    const maxValue = 100;
  
    const container = d3.select("#graph-3");
  
    const countryGroups = container.selectAll(".container-radar")
      .data(data, d => d.country);
    // ====== ENTER ======
    const countryEnter = countryGroups.enter()
      .append("div")
      .attr("class", "container-radar");
  
    const svgEnter = countryEnter.append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);
  
    // Add grid circles and percentage text (static)
    for (let i = 1; i <= levels; i++) {
      let levelFactor = radius * (i / levels);
      svgEnter.append("circle")
        .attr("r", levelFactor)
        .style("fill", "none")
        .style("stroke", "gray")
        .style("stroke-dasharray", "4,4")
        .style("opacity", 0.5);
  
      svgEnter.append("text")
        .attr("x", 0)
        .attr("y", -levelFactor)
        .attr("text-anchor", "middle")
        .text(`${(i / levels) * maxValue}%`)
        .style("font-size", "8px")
        .style("fill", "#666");
    }
  
    // Country name
    countryEnter.append("text")
      .attr("text-anchor", "middle")
      .attr("font-family", "'Bebas Neue', sans-serif")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#000")
      .text(d => d.country);
  
    // ====== UPDATE ======
    data.forEach((countryData, index) => {
      const group = container.selectAll(".container-radar")
        .filter(d => d.country === countryData.country);
      const svg = group.select("svg g");
  
      const axes = countryData.values.map(d => d.axis);
      const angleSlice = (2 * Math.PI) / axes.length;
      const rScale = d3.scaleLinear().domain([0, maxValue]).range([0, radius]);
  
      const axisLabels = svg.selectAll(".axis-label")
        .data(axes);
  
      axisLabels.join(
        enter => enter.append("text")
          .attr("class", "axis-label")
          .attr("x", (d, i) => Math.cos(angleSlice * i - Math.PI / 2) * radius * 1.4)
          .attr("y", (d, i) => Math.sin(angleSlice * i - Math.PI / 2) * radius * 1.4)
          .attr("text-anchor", "middle")
          .attr("font-family", "'Bebas Neue', sans-serif")
          .style("fill", "#000")
          .style("font-size", isAgeCert ? "12px" : "9px")
          .text(d => d),
        update => update.transition().duration(500)
          .attr("x", (d, i) => Math.cos(angleSlice * i - Math.PI / 2) * radius * 1.4)
          .attr("y", (d, i) => Math.sin(angleSlice * i - Math.PI / 2) * radius * 1.4)
          .style("font-size", isAgeCert ? "12px" : "9px")
          .text(d => d),
        exit => exit.transition().duration(300).style("opacity", 0).remove()
      );
  
      const points = countryData.values.map((d, i) => {
        const x = rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2);
        const y = rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2);
        return [x, y];
      });
  
      const polygon = svg.selectAll(".radar-shape")
        .data([points]);
  
      polygon.join(
        enter => enter.append("polygon")
          .attr("class", "radar-shape")
          .attr("points", points.map(d => d.join(",")).join(" "))
          .style("stroke", color)
          .style("stroke-width", 2)
          .style("fill", color)
          .style("fill-opacity", 0.3),
        update => update.transition().duration(800)
          .attr("points", points.map(d => d.join(",")).join(" "))
          .style("stroke", color)
          .style("fill", color)
      );
    });
 }

 function getSortLabel(sortType, ascending) {
  const labelMap = {
    country: "Country Name",
    total: "Total Value",
    axis0: "First Axis"
  };
  const arrow = ascending ? "↑" : "↓";
  return `Sort by: ${labelMap[sortType]} ${arrow}`;
}