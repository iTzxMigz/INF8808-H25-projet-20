export function drawStackedBarChart(data) {
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
        .attr("width", x.bandwidth())
        .style("stroke", "none")
        .style("opacity", 0.95);
    
    addTooltip(data, svg, x, y);
        
    addAxis(svg, height, margin, x, y);
  
    addLegend(svg, width, margin, color);
}

function addAxis(svg, height, margin, x , y) {
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
}

function addLegend(svg, width, margin, color) {
    const labelMap = {
        "Movies": "Movies",
        "TVShows": "TV Shows"
      };
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
        .text(d => labelMap[d])
        .attr("font-family", "'Bebas Neue', sans-serif")
        .attr("font-size", "18px")
        .attr("fill", "#000");
}

function addTooltip(data, svg, x, y) {
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "#141414")
        .style("color", "#fff")
        .style("border", "3px solid #e50914")
        .style("padding", "12px 16px")
        .style("border-radius", "4px")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.8)")
        .style("font-family", "'Helvetica Neue', Helvetica, Arial, sans-serif")
        .style("font-size", "14px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 10)
        .style("transition", "opacity 0.2s ease");

    svg.append("g")
        .attr("class", "hover-captures")
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", d => x(d.year))
        .attr("y", d => y(d.Movies + d.TVShows))
        .attr("width", x.bandwidth())
        .attr("height", d => y(0) - y(d.Movies + d.TVShows))
        .style("fill", "transparent")
        .style("pointer-events", "all")
        .on("mouseover", function(event, d) {
            d3.selectAll("rect")
            .filter(r => r?.data?.year === d.year)
            .style("opacity", 1);
            d3.select(this)
            .style("stroke", "black")
            .style("stroke-width", 2);
            tooltip.transition().duration(100).style("opacity", 0.9);
            tooltip.html(`Year : ${d.year}<br>
                        Movies : ${d.Movies}<br>
                        TV Shows : ${d.TVShows}<br>`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .style('font-family', 'Bebas Neue')
                    .style('font-size', '18px');;
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(event, d) {
            d3.selectAll("rect")
            .filter(r => r?.data?.year === d.year)
            .style("opacity", 0.95);
            d3.select(this)
            .style("stroke", "none");
            tooltip.transition().duration(50).style("opacity", 0);
        });
}