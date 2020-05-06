var findPolarCenter = require('../js/findPolarCenter.js')
var expect = require('chai').expect
var ndviValues = [37, 38, 41, 45, 52, 63, 73, 81, 83, 85, 85, 88, 87, 86, 76, 62, 50, 42, 36, 32]
var thetaValues = [140.44, 148.35, 156.26, 164.18, 172.09, 180, 187.91, 195.82, 203.74, 211.65, 
                  219.56, 227.47, 235.38, 243.30, 251.21, 259.12, 267.03, 274.95, 282.86, 290.77]

describe('#findPolarCenter()', function() {
  context('with number arguments', function() {
    it('should return sum of arguments', function() {
      expect(findPolarCenter(ndviValues, thetaValues)).to.eql([48.97855032660815, 216.8703740444932])
    })
  })
})