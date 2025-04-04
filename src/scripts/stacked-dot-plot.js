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
    const width = 1300, height = 400, margin = 20, padding = 2;
    let radius = 2.5;

    let x;
    if (isIMDB) {
        x = d3.scaleLinear()
              .domain([0, 10])
              .range([margin, width - margin]);
    } else {
        const ageCategories = [...new Set(mergedData.map(d => d.AgeCertification))].sort();
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
        const circles = data.map((d, i, data) => ({ x: +x(d, i, data), data: d })).sort((a, b) => a.x - b.x);
        const stackHeightLimit = 350; // Max desired height per stack
    
        // Compute total number of circles at each x
        const xCounts = new Map();
        circles.forEach(b => {
            xCounts.set(b.x, (xCounts.get(b.x) || 0) + 1);
        });

    
        // Compute required stacks for each x
        const xStackCount = new Map();
        xCounts.forEach((count, xValue) => {
            const stacksNeeded = Math.ceil(count * radius / stackHeightLimit);
            xStackCount.set(xValue, stacksNeeded);
        });

        const largestEntry = [...xStackCount.entries()].reduce((max, entry) => entry[1] > max[1] ? entry : max);

        xStackCount.forEach((count, xValue) => {
            xStackCount.set(xValue, largestEntry[1])
        });

        console.log(xStackCount);
    
        // Maps for tracking stacks
        const yStacks = new Map(); // Tracks how high each stack at x has grown
        const stackIndex = new Map(); // Current stack assignment for each x
    
        circles.forEach(b => {
            const numStacks = xStackCount.get(b.x) || 1;
            const numInStacks = xCounts.get(b.x) || 1;
            
            // Initialize stack trackers if not present
            if (!yStacks.has(b.x)) {
                yStacks.set(b.x, Array(numStacks).fill(0)); // Initialize all stacks at 0 height
                stackIndex.set(b.x, 0);
            }
    
            // Assign circle to the next available stack in a round-robin fashion
            let currentStack = stackIndex.get(b.x);
            b.y = yStacks.get(b.x)[currentStack] * radius; // Place at current stack height
            if (numInStacks >= numStacks) {
                b.x_offset = (currentStack - (numStacks - 1) / 2) * radius; // Center the stacks
            } else {
                b.x_offset = (currentStack - (numInStacks - 1) / 2) * radius;
            }
            // Update stack height
            yStacks.get(b.x)[currentStack] += 1;
    
            // Move to the next stack (round-robin)
            stackIndex.set(b.x, (currentStack + 1) % numStacks);
        });
    
        return circles;
    }
    

    topCategories.forEach((category, index) => {
        let filteredMovies = mergedData.filter(d => d.Listed_in.includes(category));
        filteredMovies = isIMDB ? filteredMovies : filteredMovies.filter(d => d.AgeCertification != null);
        console.log(filteredMovies);
        filteredMovies.sort((a, b) => a.Type.localeCompare(b.Type));
        const yOffset = index * categorySpacing;

        const categoryGroup = svg.append("g")
            .attr("transform", `translate(0, ${yOffset})`);

        categoryGroup
            .selectAll("circle")
            .data(dodge(filteredMovies, { radius: radius * 2, x: d => isIMDB ? x(d.Score) : x(d.AgeCertification) }))
            .join("circle")
            .attr("cx", d => x(isIMDB ? d.data.Score : d.data.AgeCertification) + d.x_offset)
            .attr("cy", d => height - margin - radius - d.y)
            .attr("r", radius)
            .attr("fill", (d) => d.data.Type === 'Movie' ? '#E50914' : '#221F1F')
            .on("mouseover", function(event, d) { 
                d3.selectAll("circle").style("opacity", 0.3); 
                d3.select(this)
                    .style("opacity", 1)
                    .attr("stroke", "#000");
                tooltip.transition().duration(100).style("opacity", 0.9);
                tooltip.html(`Name: ${d.data.Title}<br>Type: ${d.data.Type}<br>` + 
                    (isIMDB ? `IMDb Score: ${d.data.Score}` : `Age Rating: ${d.data.AgeCertification}`));
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

        categoryGroup.append("text")
            .attr("x", width / 2)
            .attr("y", height + 15)
            .text(isIMDB ? "IMDB Ratings" : "Age Ratings")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("font-family", "'Bebas Neue', sans-serif");

        const legend = categoryGroup.append("g")
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
    });
}
