export let isIMDB = true;
export const titleIMDB = "IMDB Scores by Category";
export const titleAge = "Age Certifications by Category";

export function initDropdownAndPlot(topCategories, mergedData) {
    const div = d3.select('#viz-container-5')
        .insert('div', function() { return this.firstChild; })
        .style('width', '100%')
        .style('margin','10px 0px')
        .style('display', 'flex')
        .style("font-family", "'Bebas Neue', sans-serif");

    div.append('button')
        .attr('id','stackedDot-toggle-btn')
        .attr('class', 'toolbar-btn')
        .style('margin-right', '10px')
        .text('Switch to Age Certifications')
        .style("font-family", "'Bebas Neue', sans-serif");

    const dropdown = div.append('div')
        .attr("id", "dropdown")

    dropdown.append('button')
        .attr('id', 'dropdown-btn')
        .attr('class', 'toolbar-btn')
        .style("font-family", "'Bebas Neue', sans-serif")
        .text(topCategories[0]);

    const dropdownContent = dropdown.append("div")
        .attr("id", "dropdown-content")
        .attr("class", "dropdown-content")
        .style("display", "none");
    
    // Append options to the dropdown-content
    ["All", ...topCategories].forEach(option => {
        dropdownContent.append("p")
            .attr("class", "dropdown-option")
            .style("font-family", "'Bebas Neue', sans-serif")
            .text(option)
            .on("click", function() {
                dropdownContent.style("display", "none");
                dropdown.select('button').text(option);
                updatePlot(option);
            });
    });

    dropdown.on('mouseenter', () => {
            dropdownContent.style('display', 'block');
        })
    dropdownContent.on('mouseenter', () => {
            dropdownContent.style('display', 'block'); 
        });
    dropdownContent.on('mouseleave', () => {
            dropdownContent.style('display', 'none');
        });

    // Hide only if the mouse is not over either element
    dropdown.on('mouseleave', hideDropdown);
    dropdownContent.on('mouseleave', hideDropdown);

    function hideDropdown() {
        setTimeout(() => {
            if (!dropdown.node().matches(':hover') && !dropdownContent.node().matches(':hover')) {
                dropdownContent.style('display', 'none');
            }
        }, 200);
    }

    function updatePlot(selectedCategory) {
        d3.select("#graph-5").select("svg").remove(); 
        const categoriesToPlot = selectedCategory === "All" ? topCategories : [selectedCategory];
        drawStackedDotPlot(categoriesToPlot, mergedData);
    }

    d3.select("#stackedDot-toggle-btn").on("click", () => {
        isIMDB = !isIMDB;
        d3.select('header h1').text(isIMDB ? titleIMDB : titleAge);
        d3.select("#stackedDot-toggle-btn").text(
            isIMDB ? "Switch to Age Ratings" : "Switch to IMDB Scores"
        );
        const category = d3.select("#viz-container-5 #dropdown-btn").text();
        updatePlot(category);
    });
    const category = d3.select("#viz-container-5 #dropdown-btn").text();
    drawStackedDotPlot([category], mergedData); 

}

export function drawStackedDotPlot(topCategories, mergedData) {
    const width = 1300, height = 350, margin = 20, radius = 5, padding = 2;

    let x;
    if (isIMDB) {
        x = d3.scaleLinear()
              .domain([0, 10])
              .range([margin, width - margin]);
    } else {
        const ageCategories = [...new Set(mergedData.map(d => d.age_certification))].sort();
        x = d3.scalePoint()
              .domain(ageCategories.filter(item => item !== null))
              .range([margin, width - margin])
              .padding(0.5);
    }

    const categorySpacing = height + margin;
    const svgHeight = categorySpacing * topCategories.length;
    const svg = d3.select("#graph-5").append("svg")
        .attr("width", width)
        .attr("height", svgHeight);

    let tooltip = d3.select("body").select(".tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
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
            .style("z-index", 10);
    }

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

    topCategories.forEach((category, index) => {
        let filteredMovies = mergedData.filter(d => d.listed_in === category);
        filteredMovies = isIMDB ? filteredMovies : filteredMovies.filter(d => d.age_certification != null);
        filteredMovies.sort((a, b) => a.type_x.localeCompare(b.type_x));
        const yOffset = index * categorySpacing;

        const categoryGroup = svg.append("g")
            .attr("transform", `translate(0, ${yOffset})`);

        categoryGroup
            .selectAll("circle")
            .data(dodge(filteredMovies, { radius: radius * 2, x: d => isIMDB ? x(d.imdb_score) : x(d.age_certification) }))
            .join("circle")
            .attr("cx", d => x(isIMDB ? d.data.imdb_score : d.data.age_certification))
            .attr("cy", d => height - margin - radius - d.y)
            .attr("r", radius)
            .attr("fill", (d) => d.data.type_x === 'Movie' ? '#E50914' : '#221F1F')
            .on("mouseover", function(event, d) { 
                d3.selectAll("circle").style("opacity", 0.3); 
                d3.select(this)
                    .style("opacity", 1)
                    .attr("stroke", "#000");
                tooltip.transition().duration(100).style("opacity", 0.9);
                tooltip.html(`Name: ${d.data.title}<br>Type: ${d.data.type_x}<br>` + 
                    (isIMDB ? `IMDb Score: ${d.data.imdb_score}` : `Age Rating: ${d.data.age_certification}`));
            })
            .on("mousemove", function(event) {
                tooltip.style("top", (event.pageY + 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function() { 
                d3.selectAll("circle").style("opacity", 1);
                d3.select(this).attr("stroke", "none");
                tooltip.transition().duration(100).style("opacity", 0);
            });

        categoryGroup.append("text")
            .attr("x", 10)
            .attr("y", height / 2)
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .text(category)
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("font-family", "'Bebas Neue', sans-serif");

        categoryGroup.append("g")
            .attr("transform", `translate(0, ${height - margin})`)
            .call(isIMDB ? d3.axisBottom(x).ticks(5).tickSizeOuter(0) : d3.axisBottom(x))
            .style("font-family", "'Bebas Neue', sans-serif");
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
