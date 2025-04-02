export function drawStackedDotPlot(topCategories, mergedData) {
    const width = 1300, height = 350, margin = 20, radius = 5, padding = 2;
    const x = d3.scaleLinear()
                .domain([0, 10])
                .range([margin, width - margin]);

    const svgHeight = height * (topCategories.length + 1) + margin;

    const svg = d3.select("#graph-5").append("svg")
        .attr("width", width)
        .attr("height", svgHeight)

    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "#141414")
        .style("color", "#fff")
        .style("border", "3px solid #e50914")
        .style("padding", "12px 16px")
        .style("border-radius", "4px")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.8)")
        .style("font-family", "'Bebas Neue', sans-serif")
        .style("font-size", "18px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 10)


    function dodge(data, { radius = 1, x = d => d } = {}) {
        const radius2 = radius ** 2;
        const circles = data.map((d, i, data) => ({x: +x(d, i, data), data: d})).sort((a, b) => a.x - b.x);
        const epsilon = 1e-3;
        let head = null, tail = null;

        function intersects(x, y) {
            let a = head;
            while (a) {
                if (radius2 - epsilon > (a.x - x) ** 2 + (a.y - y) ** 2) {
                    return true;
                }
                a = a.next;
            }
            return false;
        }

        for (const b of circles) {
            while (head && head.x < b.x - radius2) head = head.next;

            if (intersects(b.x, b.y = 0)) {
                let a = head;
                b.y = Infinity;
                do {
                    let y = a.y + Math.sqrt(radius2 - (a.x - b.x) ** 2);
                    if (y < b.y && !intersects(b.x, y)) b.y = y;
                    a = a.next;
                } while (a);
            }

            b.next = null;
            if (head === null) head = tail = b;
            else tail = tail.next = b;
        }

        return circles;
    }

    topCategories.forEach((category, idx) => {
        const filteredMovies = mergedData.filter(d => d.listed_in === category);

        const categoryGroup = svg.append("g")
            .attr("transform", `translate(0, ${idx * (height + margin)})`);

        categoryGroup
            .selectAll("circle")
            .data(dodge(filteredMovies, { radius: radius * 2, x: d => x(d.imdb_score) }))
            .join("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => height - margin - radius - d.y)
            .attr("r", radius)
            .attr("fill", (d) => d.data.type_x === 'Movie' ? '#E50914' : '#221F1F')
            .on("mouseover", function(event, d) { // Show tooltip on hover
                tooltip.transition().duration(100).style("opacity", 0.9);
                tooltip.html(`Name: ${d.data.title}<br>Type: ${d.data.type_x}<br>IMDb Score: ${d.data.imdb_score}`);
            })
            .on("mousemove", function(event) { // Position the tooltip
                tooltip.style("top", (event.pageY + 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function() { // Hide tooltip when mouse leaves
                tooltip.transition().duration(100).style("opacity", 0);
            })


        svg.append("text")
            .attr("x", 10)
            .attr("y", idx * (height + margin) + height / 2)
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .text(category)
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("font-family", "'Bebas Neue', sans-serif");

        categoryGroup.append("g")
            .attr("transform", `translate(0, 330)`)
            .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0));

    });
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 100}, 20)`);

    const legendData = [
        { type: "Movies", color: "#E50914" },
        { type: "TV Show", color: "#221F1F" }
    ];

    legend.selectAll("rect")
        .data(legendData)
        .join("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => d.color);

    legend.selectAll("text")
        .data(legendData)
        .join("text")
        .attr("x", 24)
        .attr("y", (d, i) => i * 20 + 14)
        .text(d => d.type)
        .attr("font-family", "'Bebas Neue', sans-serif")
        .attr("font-size", "18px")
        .attr("fill", "#000");

}