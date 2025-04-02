export function getMoviesAndSeries (data) {
  let map_filter = new Map();
  let data_filter = data.map((d)=> {
    if (d.rating === "TV-Y" || d.rating === "TV-Y7") {
      d.rating = "G";
    } else if (d.rating === "TV-G" || d.rating === "TV-PG") {
      d.rating = "PG";
    } else if (d.rating === "TV-14") {
      d.rating = "PG-13"
    } else if (d.rating === "TV-MA") {
      d.rating = "R"
    }
    d.date_added = d.date_added.split('/')[2];
    d.listed_in = d.listed_in.split(', ');
    d.listed_in = d.listed_in.map((l) => {
      const newCategory = mergeListedIn(l);
      if(!map_filter.has(newCategory)) {
        map_filter.set(newCategory, 1);
      } else {
        let currentCount = map_filter.get(newCategory);
        map_filter.set(newCategory, currentCount + 1);
      }
      return newCategory;
    });
    

    return {
      Title: d.title, 
      Type: d.type_x, 
      ReleaseYear: d.release_year,
      AgeCertification: d.rating,
      Score: d.imdb_score,
      Country: d.country,
      DateAdded: d.date_added,
      Listed_in: d.listed_in
    }



  });
  return data_filter;
}

function mergeListedIn(categorie) {
  //Catégorie pour Action & Adventure
  if (categorie === 'TV Action & Adventure') {
    return 'Action & Adventure';
  }
  // Catégorie pour Horror
  if (categorie === 'TV Horror' || categorie === 'Horror Movies') {
    return 'Horror';
  }
  // Catégorie pour Drama
  if (categorie === 'TV Dramas') {
    return 'Dramas';
  }
  // Catégorie International
  if (categorie === 'International TV Shows' || categorie === 'International Movies') {
    return 'International';
  }
  // Catégorie Comédie
  if (categorie === 'TV Comedies') {
    return 'Comedies';
  }
  // Catégorie Anime
  if (categorie === 'Anime Features' || categorie === 'Anime Series') {
    return 'Anime';
  }
  // Documentaries
  if (categorie === 'Docuseries') {
    return 'Documentaries';
  }
  // Romantic
  if (categorie === 'Romantic Movies' || categorie === 'Romantic TV Shows') {
    return 'Romantic';
  }
  // Thrillers
  if (categorie === 'TV Thrillers') {
    return 'Thrillers';
  }
  // Sci-Fi & Fantasy
  if (categorie === 'TV Sci-Fi & Fantasy') {
    return 'Sci-Fi & Fantasy';
  }
  // Stand-Up Comedy & Talk Shows
  if (categorie === 'Stand-Up Comedy & Talk Shows') {
    return 'Stand-Up Comedy';
  }
  
  return categorie;
}

export function getFilterMoviesSeriesByYear(movies) {
  let yearlyCounts = new Map();
  movies.forEach(m => {
    let year = m.DateAdded
    if (!yearlyCounts.has(year)) {
      yearlyCounts.set(year, {year: year, Movies: 0, TVShows: 0 });
    }
    if (m.Type === "Movie") {
      yearlyCounts.get(year).Movies++;
    } else {
      yearlyCounts.get(year).TVShows++;
    }
  });
  return yearlyCounts;
  
}

export function processCategoriesForHeatmap(data, numberPerYear) {
  let categoryMap = new Map();
  let allYears = d3.range(2009, 2022);
  console.log(numberPerYear);
  

  data.forEach(d => {
    let year = +d.DateAdded;
    d.Listed_in.forEach(category => {
      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map());
      }

      let yearMap = categoryMap.get(category);
      yearMap.set(year, (yearMap.get(year) || 0) + 1);
    });
  });

  // Trier et prendre les 10 meilleures catégories
  let sortedCategories = Array.from(categoryMap.entries())
    .map(([category, years]) => ({ 
      category, 
      count: Array.from(years.values()).reduce((a, b) => a + b, 0), 
      values: years 
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  // Transformer en format heatmap
  let heatmapData = [];
  sortedCategories.forEach(({ category, values }) => {
    allYears.forEach(year => {
      const yearString = year.toString();
      const total = numberPerYear.get(yearString)? 
      numberPerYear.get(yearString).Movies + numberPerYear.get(yearString).TVShows: 0;
      heatmapData.push({
        year: year,
        category: category,
        count: values.get(year) || 0,
        total: total,
        percentage: total!== 0? ((values.get(year) || 0) / total * 100) : 0
      });
    });
  });
  console.log(heatmapData);
  return { heatmapData, sortedCategories: sortedCategories.map((c) => c.category) };
}

export function preprocessRadarChart(data, categoriesList) {
  let countryMap = new Map();
  const ageCertList = ["G", "PG", "PG-13", "R", "NC-17"];

  // Step 1: Group data by country
  data.forEach(d => {
      let country = d.Country;
      let ageCert = d.AgeCertification;
      let categories = d.Listed_in || [];

      if (!countryMap.has(country)) {
          countryMap.set(country, { 
              count: 0, 
              ageCertifications: new Map(), 
              categories: new Map() 
          });
      }

      let countryData = countryMap.get(country);
      countryData.count++;

      countryData.ageCertifications.set(ageCert, (countryData.ageCertifications.get(ageCert) || 0) + 1);

      categories.forEach(category => {
          countryData.categories.set(category, (countryData.categories.get(category) || 0) + 1);
      });
  });

  let sortedCountries = Array.from(countryMap.entries())
      .sort((a, b) => b[1].count - a[1].count);
  let topCountries = sortedCountries.filter(d => d[0] !== "Not Given").slice(0, 20);
  let otherCountries = sortedCountries.slice(20);

  let othersData = { count: 0, ageCertifications: new Map(), categories: new Map() };
  otherCountries.forEach(([country, data]) => {
      othersData.count += data.count;

      data.ageCertifications.forEach((value, ageCert) => {
          othersData.ageCertifications.set(ageCert, (othersData.ageCertifications.get(ageCert) || 0) + value);
      });

      data.categories.forEach((value, category) => {
          othersData.categories.set(category, (othersData.categories.get(category) || 0) + value);
      });
  });

  let finalData = new Map(topCountries);
  finalData.set("Others", othersData);

  let radarAgeCert = Array.from(finalData.entries()).map(([country, data]) => {
      let ageCertCounts = Object.fromEntries(data.ageCertifications);
      ageCertList.forEach(cert => {
        if (!(cert in ageCertCounts)) {
            ageCertCounts[cert] = 0;
        }
    });
      return {
          country: country,
          count: data.count,
          ageCertifications: ageCertCounts
      };
  });

  let radarCategories = Array.from(finalData.entries()).map(([country, data]) => {
      let categoryCounts = Object.fromEntries(data.categories);

      // Ensure all categories from categoriesList exist with a default value of 0
      categoriesList.forEach(category => {
          if (!(category in categoryCounts)) {
              categoryCounts[category] = 0;
          }
      });

      categoryCounts = Object.fromEntries(
        Object.entries(categoryCounts).filter(([key]) => categoriesList.includes(key))
    );

      return {
          country: country,
          count: data.count,
          categories: categoryCounts
      };
  });

  return { radarAgeCert, radarCategories };
}

export function prepareRadarChartData(radarData, type) {
  return radarData.map(d => {
    const values = Object.entries(type === "ageCert" ? d.ageCertifications : d.categories)
        .map(([key, value]) => ({ axis: key, value }));

        const totalCount = d.count;
    const percentageValues = values.map(v => ({
      axis: v.axis,
      value: totalCount > 0 ? (v.value / totalCount) * 100 : 0
    })).sort((a, b) => a.axis.localeCompare(b.axis));

    return {
      country: d.country,
      values: percentageValues
    };
  });
}

export function prepareStackedDotPlotData(data) {
  const categoryCounts = {};
  data.forEach((d) => {
      d.listed_in
          .map((s) => s.trim())
          .map(mergeListedIn)
          .forEach((category) => {
              categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          });
  });

  const topCategories = Object.entries(categoryCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 10)
      .map(([category]) => category);

  data.forEach((d) => {
      const mergedCategories = d.listed_in
          .map((s) => s.trim())
          .map(mergeListedIn);
      const primaryCategory = mergedCategories[0];
      if (!topCategories.includes(primaryCategory)) {
          d.listed_in = 'Other';
      } else {
          d.listed_in = primaryCategory;
      }
  });

  const categories = topCategories;

  return {
    categories: categories,
    data: data
  };
}