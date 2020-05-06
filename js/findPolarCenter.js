module.exports = function(rValues, thetaValues) {
  let xValueList = [] 
  let yValueList = []

  // convert polar coordinates to cartesian x and y coordinates
  rValues.forEach(function(item, index) { 
      xValueList.push(item * Math.cos((Math.PI/180) * thetaValues[index]))
      yValueList.push(item * Math.sin((Math.PI/180) * thetaValues[index]))
  })

  // find the mean for x and y array
  let xMean = (xValueList.reduce((a, b) => a + b, 0)) / xValueList.length 
  let yMean = (yValueList.reduce((a, b) => a + b, 0)) / yValueList.length

  // convert back to polar coordinates (r and theta)
  let r = Math.sqrt((xMean * xMean) + (yMean * yMean))
  let theta = (Math.atan(yMean / xMean)) * (180/Math.PI)

  // adjust the angle due to arctangent returning negative values
  if ((xMean < 0 && yMean > 0) || (xMean < 0 && yMean < 0)) { // quadrant 2 and quadrant 3
      theta += 180
    }
  if (xMean > 0 && yMean < 0) { // quadrant 4
      theta += 360
  }

  return [r, theta]
}