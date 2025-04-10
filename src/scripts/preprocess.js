/**
 * @param data
 */
export function getMoviesAndSeries (data) {
  const map_filter = new Map()
  const data_filter = data.map((d) => {
    if (d.rating === 'TV-Y' || d.rating === 'TV-Y7') {
      d.rating = 'G'
    } else if (d.rating === 'TV-G' || d.rating === 'TV-PG') {
      d.rating = 'PG'
    } else if (d.rating === 'TV-14') {
      d.rating = 'PG-13'
    } else if (d.rating === 'TV-MA') {
      d.rating = 'R'
    }
    d.date_added = d.date_added.split('/')[2]
    d.listed_in = d.listed_in.split(', ')
    d.listed_in = d.listed_in.map((l) => {
      const newCategory = mergeListedIn(l)
      if (!map_filter.has(newCategory)) {
        map_filter.set(newCategory, 1)
      } else {
        const currentCount = map_filter.get(newCategory)
        map_filter.set(newCategory, currentCount + 1)
      }
      return newCategory
    })

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
  })
  return data_filter
}

/**
 * @param categorie
 */
function mergeListedIn (categorie) {
  // Catégorie pour Action & Adventure
  if (categorie === 'TV Action & Adventure') {
    return 'Action & Adventure'
  }
  // Catégorie pour Horror
  if (categorie === 'TV Horror' || categorie === 'Horror Movies') {
    return 'Horror'
  }
  // Catégorie pour Drama
  if (categorie === 'TV Dramas') {
    return 'Dramas'
  }
  // Catégorie International
  if (categorie === 'International TV Shows' || categorie === 'International Movies') {
    return 'International'
  }
  // Catégorie Comédie
  if (categorie === 'TV Comedies') {
    return 'Comedies'
  }
  // Catégorie Anime
  if (categorie === 'Anime Features' || categorie === 'Anime Series') {
    return 'Anime'
  }
  // Documentaries
  if (categorie === 'Docuseries') {
    return 'Documentaries'
  }
  // Romantic
  if (categorie === 'Romantic Movies' || categorie === 'Romantic TV Shows') {
    return 'Romantic'
  }
  // Thrillers
  if (categorie === 'TV Thrillers') {
    return 'Thrillers'
  }
  // Sci-Fi & Fantasy
  if (categorie === 'TV Sci-Fi & Fantasy') {
    return 'Sci-Fi & Fantasy'
  }
  // Stand-Up Comedy & Talk Shows
  if (categorie === 'Stand-Up Comedy & Talk Shows') {
    return 'Stand-Up Comedy'
  }

  return categorie
}

/**
 * @param movies
 */
export function getFilterMoviesSeriesByYear (movies) {
  const yearlyCounts = new Map()
  movies.forEach(m => {
    const year = m.DateAdded
    if (!yearlyCounts.has(year)) {
      yearlyCounts.set(year, { year: year, Movies: 0, TVShows: 0 })
    }
    if (m.Type === 'Movie') {
      yearlyCounts.get(year).Movies++
    } else {
      yearlyCounts.get(year).TVShows++
    }
  })
  return yearlyCounts
}

/**
 * @param data
 * @param numberPerYear
 */
export function processCategoriesForHeatmap (data, numberPerYear) {
  const categoryMap = new Map()
  const allYears = d3.range(2009, 2022)

  data.forEach(d => {
    const year = +d.DateAdded
    d.Listed_in.forEach(category => {
      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map())
      }

      const yearMap = categoryMap.get(category)
      yearMap.set(year, (yearMap.get(year) || 0) + 1)
    })
  })

  // Trier et prendre les 10 meilleures catégories
  const sortedCategories = Array.from(categoryMap.entries())
    .map(([category, years]) => ({
      category,
      count: Array.from(years.values()).reduce((a, b) => a + b, 0),
      values: years
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  // Transformer en format heatmap
  const heatmapData = []
  sortedCategories.forEach(({ category, values }) => {
    allYears.forEach(year => {
      const yearString = year.toString()
      const total = numberPerYear.get(yearString)
        ? numberPerYear.get(yearString).Movies + numberPerYear.get(yearString).TVShows : 0
      heatmapData.push({
        year: year,
        category: category,
        count: values.get(year) || 0,
        total: total,
        percentage: total !== 0 ? ((values.get(year) || 0) / total * 100) : 0
      })
    })
  })
  return { heatmapData, sortedCategories: sortedCategories.map((c) => c.category) }
}

/**
 * @param data
 * @param categoriesList
 */
export function preprocessRadarChart (data, categoriesList) {
  const countryMap = new Map()
  const ageCertList = ['G', 'PG', 'PG-13', 'R', 'NC-17']

  // Step 1: Group data by country
  data.forEach(d => {
    const country = d.Country
    const ageCert = d.AgeCertification
    const categories = d.Listed_in || []

    if (!countryMap.has(country)) {
      countryMap.set(country, {
        count: 0,
        ageCertifications: new Map(),
        categories: new Map()
      })
    }

    const countryData = countryMap.get(country)
    countryData.count++

    countryData.ageCertifications.set(ageCert, (countryData.ageCertifications.get(ageCert) || 0) + 1)

    categories.forEach(category => {
      countryData.categories.set(category, (countryData.categories.get(category) || 0) + 1)
    })
  })

  const sortedCountries = Array.from(countryMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
  const topCountries = sortedCountries.filter(d => d[0] !== 'Not Given').slice(0, 20)
  const otherCountries = sortedCountries.slice(20)

  const othersData = { count: 0, ageCertifications: new Map(), categories: new Map() }
  otherCountries.forEach(([country, data]) => {
    othersData.count += data.count

    data.ageCertifications.forEach((value, ageCert) => {
      othersData.ageCertifications.set(ageCert, (othersData.ageCertifications.get(ageCert) || 0) + value)
    })

    data.categories.forEach((value, category) => {
      othersData.categories.set(category, (othersData.categories.get(category) || 0) + value)
    })
  })

  const finalData = new Map(topCountries)
  finalData.set('Others', othersData)

  const radarAgeCert = Array.from(finalData.entries()).map(([country, data]) => {
    const ageCertCounts = Object.fromEntries(data.ageCertifications)
    ageCertList.forEach(cert => {
      if (!(cert in ageCertCounts)) {
        ageCertCounts[cert] = 0
      }
    })
    return {
      country: country,
      count: data.count,
      ageCertifications: ageCertCounts
    }
  })

  const radarCategories = Array.from(finalData.entries()).map(([country, data]) => {
    let categoryCounts = Object.fromEntries(data.categories)

    // Ensure all categories from categoriesList exist with a default value of 0
    categoriesList.forEach(category => {
      if (!(category in categoryCounts)) {
        categoryCounts[category] = 0
      }
    })

    categoryCounts = Object.fromEntries(
      Object.entries(categoryCounts).filter(([key]) => categoriesList.includes(key))
    )

    return {
      country: country,
      count: data.count,
      categories: categoryCounts
    }
  })

  return { radarAgeCert, radarCategories }
}

/**
 * @param radarData
 * @param type
 */
export function prepareRadarChartData (radarData, type) {
  return radarData.map(d => {
    const values = Object.entries(type === 'ageCert' ? d.ageCertifications : d.categories)
      .map(([key, value]) => ({ axis: key, value }))

    const totalCount = d.count
    const percentageValues = values.map(v => ({
      axis: v.axis,
      value: totalCount > 0 ? (v.value / totalCount) * 100 : 0
    })).sort((a, b) => a.axis.localeCompare(b.axis))

    return {
      country: d.country,
      values: percentageValues
    }
  })
}

/**
 * @param data
 */
export function prepareStackedDotPlotData (data) {
  const categoryCounts = {}

  data.forEach((d) => {
    d.Listed_in
      .map((s) => s.trim())
      .map(mergeListedIn)
      .forEach((category) => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      })
  })

  const topCategories = Object.entries(categoryCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 10)
    .map(([category]) => category)

  data.forEach((d) => {
    const mergedCategories = d.Listed_in
      .map((s) => s.trim())
      .map(mergeListedIn)
      .map(category => topCategories.includes(category) ? category : 'Other')

    d.Listed_in = [...new Set(mergedCategories)] // Remove duplicates
  })

  return {
    categories: topCategories,
    data: data
  }
}
