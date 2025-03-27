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
      .attr('fill', 'rgba(229, 9, 20, 1)')
      .attr('stroke', '#000')
      .style('pointer-events', 'none');

    countryPaths
      .filter(d => {
        const name = countryNameMapping[d.properties.name] || d.properties.name;
        return countryCounts[name] !== undefined;
      })

      .on('mouseover', function (event, d) {
        d3.selectAll('path').attr('fill', '#ccc').attr('opacity', 0.5);
        d3.select(this).attr('fill', '#666').attr('opacity', 1);
      
        const countryName = countryNameMapping[d.properties.name] || d.properties.name;
      
        // Move hovered country to the top
        const reordered = [
          [countryName, countryCounts[countryName]],
          ...originalSortedCountries.filter(([c]) => c !== countryName)
        ];
      
        renderCountryTable(reordered, countryName);
      })

      .on('mouseout', function () {
        d3.selectAll('path').attr('fill', '#ccc').attr('opacity', 1);
        renderCountryTable(originalSortedCountries);
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
