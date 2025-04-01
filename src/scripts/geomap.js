'use strict';

import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { countryCentroids } from '../assets/data/country-centroids.js';
import { geoRobinson } from 'd3-geo-projection';

const width = 960;
const height = 600;

// Country name discrepancies
const countryNameMapping = {
	"United States of America": "United States",
	"Czechia": "Czech Republic",
	"Singapore": "Singapore"
};

export function drawGeomap(data) {
// When appending the flex container
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

	const container = d3.select("#graph-4")
		.append("div")
		.attr("class", "geomap-container")
		.style("display", "flex")
		.style("gap", "20px")
		.style("justify-content", "space-between")
		.style("align-items", "flex-start");

	const svg = container.append("svg")
		.attr("width", width)
		.attr("height", height);

	const projection = geoRobinson()
		.scale(150)
		.translate([width / 2, height / 1.5]);

	const path = d3.geoPath().projection(projection);

	// Process the data
	const countryCounts = {};
	const countryScores = {};

	data.forEach(d => {
	const country = d.Country?.trim() || 'EMPTY';
	const score = parseFloat(d.Score);

	if (country && country !== 'Not Given') {
		if (!countryCounts[country]) {
		countryCounts[country] = 0;
		countryScores[country] = 0;
		}
		countryCounts[country]++;
		countryScores[country] += score;
	}
	});

	const countryAverages = {};
	for (const country in countryScores) {
		countryAverages[country] = countryScores[country] / countryCounts[country];
	}

	const scoreExtent = d3.extent(Object.values(countryAverages));
	const colorScale = d3.scaleSequential(d3.interpolateReds)
						.domain(scoreExtent)
						.clamp(true);

	// Load and draw map
	d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json').then(world => {
	const countries = topojson.feature(world, world.objects.countries).features;

	const countryPaths = svg.append('g')
		.selectAll('path')
		.data(countries)
		.enter().append('path')
		.attr('d', path)
		.attr('fill', '#ccc')
		.attr('stroke', '#333');

	const radiusScale = d3.scaleSqrt()
		.domain([0, d3.max(Object.values(countryCounts))])
		.range([0, Math.sqrt(20)]);

	svg.append('g')
		.selectAll('circle')
		.data(Object.entries(countryCounts))
		.enter().append('circle')
		.attr('cx', d => {
			const centroid = countryCentroids[d[0]];
			return centroid ? projection(centroid)[0] : 0;
		})
		.attr('cy', d => {
			const centroid = countryCentroids[d[0]];
			return centroid ? projection(centroid)[1] : 0;
		})
		.attr('r', d => radiusScale(d[1]) * 8)
		.attr('fill', d => colorScale(countryAverages[d[0]]))

		.attr('stroke', '#000')
		.style('pointer-events', 'none');

	countryPaths
		.filter(d => {
		  const name = countryNameMapping[d.properties.name] || d.properties.name;
		  return countryCounts[name] !== undefined;
		})
		.on('mouseover', function (event, d) {
		  const name = countryNameMapping[d.properties.name] || d.properties.name;
	  
		  d3.selectAll('path').attr('fill', '#ccc').attr('opacity', 0.5);
		  d3.select(this).attr('fill', '#666').attr('opacity', 1)
						 .style("stroke", "black")
						 .style("stroke-width", 2);
	  
		  d3.selectAll('tr').classed('highlight', false);
		  d3.select(`tr[data-country="${name}"]`).classed('highlight', true);
	  
		  tooltip.transition().duration(100).style("opacity", 0.9);
		  tooltip.html(`
			<strong>${name}</strong><br>
			Total titles: ${countryCounts[name]}<br>
			Avg IMDb: ${countryAverages[name].toFixed(2)}
		  `)
		  .style("left", (event.pageX + 10) + "px")
		  .style("top", (event.pageY - 28) + "px")
		  .style('font-family', 'Bebas Neue')
		  .style('font-size', '18px');
		})
		.on("mousemove", function (event) {
		  tooltip
			.style("left", (event.pageX + 10) + "px")
			.style("top", (event.pageY - 28) + "px");
		})
		.on('mouseout', function () {
		  d3.selectAll('path').attr('fill', '#ccc').attr('opacity', 1)
							  .style("stroke", "none");
	  
		  d3.selectAll('tr').classed('highlight', false);
	  
		  tooltip.transition().duration(100).style("opacity", 0);
		});

		
	function renderCountryTable(sortedCountries, highlightCountry = null) {
		const tbody = d3.select("#country-table-body");
		tbody.selectAll("tr").remove();

		sortedCountries.forEach(([country, count]) => {
		const row = tbody.append("tr")
			.attr("data-country", country)
			.classed("highlight", country === highlightCountry);
		row.append("td").text(country);
		row.append("td").text(count);
		row.append("td").text(countryAverages[country].toFixed(2));
		});
	}

	const tableContainer = container.append("div")
		.attr("class", "table")
		.attr("id", "country-table")
		.style("height", "600px")
		.style("overflow-y", "scroll")
		.style("flex", "1");


	const table = tableContainer.append("table");

	// Header
	const thead = table.append("thead");
	thead.append("tr")
		.selectAll("th")
		.data(["Country", "Total Movies", "Average IMDB Score"])
		.enter()
		.append("th")
		.text(d => d);

	// Body
	const tbody = table.append("tbody").attr("id", "country-table-body");

	const sortedCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);

	const originalSortedCountries = [...sortedCountries];
	renderCountryTable(originalSortedCountries);

	sortedCountries.forEach(([country, count]) => {
		const row = tbody.append("tr").attr("data-country", country);
		row.append("td").text(country);
		row.append("td").text(count);
		row.append("td").text(countryAverages[country].toFixed(2));
	});
	});
}
