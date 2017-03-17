var config = {
  "mapserverUrl": "http://gis.nemac.org/landat",
  "layout" : {
    "layer-groups-order": [
      {
        "id": "phenoclass-derived",
        "name": "Phenoclass-derived Products",
        "active": false
      },
      {
        "id": "it-metrics",
        "name": "IT Metrics",
        "active": false
      },
      {
        "id": "phenology-variables",
        "name": "Phenology Variables",
        "active": true
      },
      {
        "id": "phenoclasses",
        "name": "Phenoclasses",
        "active": false
      }
    ],
    "active-layers": [
      // String of the form "<layer-group-id> <layer-id>"
      "phenology-variables MeanNDVI"
    ]
  },
  "layers" : {
    "it-metrics": [
      {
        "id": "DecreaseChange",
        "name": "Rate of Change: Decreases",
        "info": "The portion of the inter-annual change events associated with declining productivity.",
      },
      {
        "id": "Ascendency",
        "name": "Ascendency",
        "info": "Landscape dynamic organization and productivity",
      },
      {
        "id": "Development",
        "name": "Development",
        "info": "NMI/H",
      },
      {
        "id": "MutualInformation",
        "name": "Mutual Information",
        "info": "Organized/predictable landscape dynamic complexity",
      },
      {
        "id": "IncreaseChange",
        "name": "Rate of Change: Increases",
        "info": "The portion of the inter-annual change events associated iwth increasing productivity (increasing NDVI)",
      },
      {
        "id": "Capacity",
        "name": "Capacity",
        "info": "Total landscape dynamic complexity and productivity",
      },
      {
        "id": "Overhead",
        "name": "Overhead",
        "info": "Landscape dynamic redundancy/disorganization and productivity",
      },        
      {
        "id": "MeanShannon",
        "name": "Shannon Diversity",
        "info": "Total landscape dynamic complexity",
      },
      {
        "id": "ConditionalEntropy",
        "name": "Conditional Entropy",
        "info": "Disorganized/redundant landscape dynamic complexity",
      },        
      {
        "id": "DynamicActivity",
        "name": "Rate of inter-annual change",
        "info": "The old 'dynamic activity'",
      }
    ],
    "phenology-variables": [
      {
        "id": "MeanNDVI",
        "name": "Mean Growing Season NDVI",
        "info": "NDVI mean",
      },
      {
        "id": "SeasonLength",
        "name": "Growing Season Length",
        "info": "Number of days between the 15th and 85th percentile cutoffs"
      },
      {
        "id": "Midpoint",
        "name": "Growing Season Peak",
        "info": "Middle of Growing Season (day of year)"
      },
      {
        "id": "NDVIStdDv",
        "name": "Variability in Greenness",
        "info": "NDVI Standard Deviation"
      },
      {
        "id": "Seasonality",
        "name": "Seasonality/Mean Vector Greenness",
        "info": "Mean vector greenness"
      },
      {
        "id": "BeginningGrowingSeason",
        "name": "Beginning of Growing Season",
        "info": "15th percentile cutoff (day of year) -- an arbitrary but standard start of spring milestone."
      },
      {
        "id": "EndGrowingSeason",
        "name": "End of Growing Season",
        "info": "No description yet"
      }
    ],
    "phenoclasses": [
      {
        "id": "Phenoclasses_2001",
        "name": "500 Phenoclasses 2001",
        "info": ""
      },
      {
        "id": "Phenoclasses_2002",
        "name": "500 Phenoclasses 2002",
        "info": ""
      },
      {
        "id": "Phenoclasses_2003",
        "name": "500 Phenoclasses 2003",
        "info": ""
      },
      {
        "id": "Phenoclasses_2004",
        "name": "500 Phenoclasses 2004",
        "info": ""
      },
      {
        "id": "Phenoclasses_2005",
        "name": "500 Phenoclasses 2005",
        "info": ""
      },
      {
        "id": "Phenoclasses_2006",
        "name": "500 Phenoclasses 2006",
        "info": ""
      },
      {
        "id": "Phenoclasses_2007",
        "name": "500 Phenoclasses 2007",
        "info": ""
      },
      {
        "id": "Phenoclasses_2008",
        "name": "500 Phenoclasses 2008",
        "info": ""
      },
      {
        "id": "Phenoclasses_2009",
        "name": "500 Phenoclasses 2009",
        "info": ""
      },
      {
        "id": "Phenoclasses_2010",
        "name": "500 Phenoclasses 2010",
        "info": ""
      },
      {
        "id": "Phenoclasses_2011",
        "name": "500 Phenoclasses 2011",
        "info": ""
      },
      {
        "id": "Phenoclasses_2012",
        "name": "500 Phenoclasses 2012",
        "info": ""
      },
      {
        "id": "Phenoclasses_2013",
        "name": "500 Phenoclasses 2013",
        "info": ""
      },
      {
        "id": "Phenoclasses_2014",
        "name": "500 Phenoclasses 2014",
        "info": ""
      },
      {
        "id": "Phenoclasses_2015",
        "name": "500 Phenoclasses 2015",
        "info": ""
      },
      {
        "id": "Phenoclasses_2016",
        "name": "500 Phenoclasses 2016",
        "info": ""
      },
      {
        "id": "Phenoclasses_2017",
        "name": "500 Phenoclasses 2017",
        "info": ""
      }
    ],
    "phenoclass-derived": [
      {
        "id": "TotalPath",
        "name": "Total path",
        "info": "Total summed 'length' of all annual phenological changes from 2000 to 2015."
      },
      {
        "id": "FinalDistance",
        "name": "Final distance",
        "info": "Amount or 'length' of phenological difference between the forst and last years, 2000 and 2015."
      },
      {
        "id": "MaximumStep",
        "name": "Maximum step",
        "info": "The largest annual phenological change observed between any two consecutive years."
      },
      {
        "id": "MeanStep",
        "name": "Mean step",
        "info": "The mean annual phenological change observed between consecutive years."
      },
      {
        "id": "MinimumStep",
        "name": "Minimum step",
        "info": "The smallest annual phenological change observed between any two consecutive years."
      },
      {
        "id": "MaximumDistance",
        "name": "Maximum distance",
        "info": "The phenological difference between the two most different years, from 2000 to 2015."
      },
      {
        "id": "MeanDistance",
        "name": "Mean distance",
        "info": "The mean phenological difference between any two years, from 2000 to 2015."
      },
      {
        "id": "MinimumDistance",
        "name": "Minimum distance",
        "info": "The phenological difference between the two most similar years, from 2000 to 2015."
      },
      {
        "id": "HighNDVI",
        "name": "High NDVI",
        "info": "Highest mean annual NDVI reached, from 2000 to 2015."
      },
      {
        "id": "LowNDVI",
        "name": "Low NDVI",
        "info": "Lowest mean annual NDVI reached, from 2000 to 2015."
      }
    ]
  }
}
