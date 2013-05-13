// Copyright 2002-2012, University of Colorado

/**
 * Cubic Bezier segment.
 *
 * See http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf for info
 *
 * Good reference: http://cagd.cs.byu.edu/~557/text/ch2.pdf
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define( function( require ) {
  'use strict';
  
  var assert = require( 'ASSERT/assert' )( 'kite' );

  var kite = require( 'KITE/kite' );
  
  var inherit = require( 'PHET_CORE/inherit' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var Vector2 = require( 'DOT/Vector2' );
  var Matrix3 = require( 'DOT/Matrix3' );
  var solveQuadraticRootsReal = require( 'DOT/Util' ).solveQuadraticRootsReal;
  var solveCubicRootsReal = require( 'DOT/Util' ).solveCubicRootsReal;
  
  var Segment = require( 'KITE/segments/Segment' );
  require( 'KITE/segments/Quadratic' );

  Segment.Cubic = function Cubic( start, control1, control2, end, skipComputations ) {
    this.start = start;
    this.control1 = control1;
    this.control2 = control2;
    this.end = end;
    
    // allows us to skip unnecessary computation in the subdivision steps
    if ( skipComputations ) {
      return;
    }
    
    if ( start.equals( end, 0 ) && start.equals( control1, 0 ) && start.equals( control2, 0 ) ) {
      this.invalid = true;
      return;
    }
    
    this.startTangent = this.tangentAt( 0 ).normalized();
    this.endTangent = this.tangentAt( 1 ).normalized();
    
    // from http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf
    this.r = control1.minus( start ).normalized();
    this.s = this.r.perpendicular();
    
    var a = start.times( -1 ).plus( control1.times( 3 ) ).plus( control2.times( -3 ) ).plus( end );
    var b = start.times( 3 ).plus( control1.times( -6 ) ).plus( control2.times( 3 ) );
    var c = start.times( -3 ).plus( control1.times( 3 ) );
    var d = start;
    
    var aPerp = a.perpendicular();
    var bPerp = b.perpendicular();
    var aPerpDotB = aPerp.dot( b );
    
    this.tCusp = -0.5 * ( aPerp.dot( c ) / aPerpDotB );
    this.tDeterminant = this.tCusp * this.tCusp - ( 1 / 3 ) * ( bPerp.dot( c ) / aPerpDotB );
    if ( this.tDeterminant >= 0 ) {
      var sqrtDet = Math.sqrt( this.tDeterminant );
      this.tInflection1 = this.tCusp - sqrtDet;
      this.tInflection2 = this.tCusp + sqrtDet;
    }
    
    if ( this.hasCusp() ) {
      // if there is a cusp, we'll split at the cusp into two quadratic bezier curves.
      // see http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.94.8088&rep=rep1&type=pdf (Singularities of rational Bezier curves - J Monterde, 2001)
      var subdividedAtCusp = this.subdivided( this.tCusp, true );
      this.startQuadratic = new Segment.Quadratic( subdividedAtCusp[0].start, subdividedAtCusp[0].control1, subdividedAtCusp[0].end, false );
      this.endQuadratic = new Segment.Quadratic( subdividedAtCusp[1].start, subdividedAtCusp[1].control2, subdividedAtCusp[1].end, false );
    }
    
    this.bounds = Bounds2.NOTHING;
    this.bounds = this.bounds.withPoint( this.start );
    this.bounds = this.bounds.withPoint( this.end );
    
    /*---------------------------------------------------------------------------*
    * Bounds
    *----------------------------------------------------------------------------*/
    
    // finds what t values the cubic extrema are at (if any).
    function extremaT( v0, v1, v2, v3 ) {
      // coefficients of derivative
      var a = -3 * v0 + 9 * v1 -9 * v2 + 3 * v3;
      var b =  6 * v0 - 12 * v1 + 6 * v2;
      var c = -3 * v0 + 3 * v1;
      
      return solveQuadraticRootsReal( a, b, c );
    }
    
    var cubic = this;
    this.xExtremaT = extremaT( this.start.x, this.control1.x, this.control2.x, this.end.x );
    _.each( this.xExtremaT, function( t ) {
      if ( t >= 0 && t <= 1 ) {
        cubic.bounds = cubic.bounds.withPoint( cubic.positionAt( t ) );
      }
    } );
    this.yExtremaT = extremaT( this.start.y, this.control1.y, this.control2.y, this.end.y );
    _.each( this.yExtremaT, function( t ) {
      if ( t >= 0 && t <= 1 ) {
        cubic.bounds = cubic.bounds.withPoint( cubic.positionAt( t ) );
      }
    } );
    
    if ( this.hasCusp() ) {
      this.bounds = this.bounds.withPoint( this.positionAt( this.tCusp ) );
    }
  };
  inherit( Segment.Cubic, Segment, {
    
    degree: 3,
    
    hasCusp: function() {
      var epsilon = 0.000001; // TODO: make this available to change?
      return this.tangentAt( this.tCusp ).magnitude() < epsilon && this.tCusp >= 0 && this.tCusp <= 1;
    },
    
    // position: (1 - t)^3*start + 3*(1 - t)^2*t*control1 + 3*(1 - t) t^2*control2 + t^3*end
    positionAt: function( t ) {
      var mt = 1 - t;
      return this.start.times( mt * mt * mt ).plus( this.control1.times( 3 * mt * mt * t ) ).plus( this.control2.times( 3 * mt * t * t ) ).plus( this.end.times( t * t * t ) );
    },
    
    // derivative: -3 p0 (1 - t)^2 + 3 p1 (1 - t)^2 - 6 p1 (1 - t) t + 6 p2 (1 - t) t - 3 p2 t^2 + 3 p3 t^2
    tangentAt: function( t ) {
      var mt = 1 - t;
      return this.start.times( -3 * mt * mt ).plus( this.control1.times( 3 * mt * mt - 6 * mt * t ) ).plus( this.control2.times( 6 * mt * t - 3 * t * t ) ).plus( this.end.times( 3 * t * t ) );
    },
    
    curvatureAt: function( t ) {
      // see http://cagd.cs.byu.edu/~557/text/ch2.pdf p31
      // TODO: remove code duplication with Quadratic
      var epsilon = 0.0000001;
      if ( Math.abs( t - 0.5 ) > 0.5 - epsilon ) {
        var isZero = t < 0.5;
        var p0 = isZero ? this.start : this.end;
        var p1 = isZero ? this.control1 : this.control2;
        var p2 = isZero ? this.control2 : this.control1;
        var d10 = p1.minus( p0 );
        var a = d10.magnitude();
        var h = ( isZero ? -1 : 1 ) * d10.perpendicular().normalized().dot( p2.minus( p1 ) );
        return ( h * ( this.degree - 1 ) ) / ( this.degree * a * a );
      } else {
        return this.subdivided( t, true )[0].curvatureAt( 1 );
      }
    },
    
    toRS: function( point ) {
      var firstVector = point.minus( this.start );
      return new Vector2( firstVector.dot( this.r ), firstVector.dot( this.s ) );
    },
    
    subdivided: function( t, skipComputations ) {
      // de Casteljau method
      // TODO: add a 'bisect' or 'between' method for vectors?
      var left = this.start.blend( this.control1, t );
      var right = this.control2.blend( this.end, t );
      var middle = this.control1.blend( this.control2, t );
      var leftMid = left.blend( middle, t );
      var rightMid = middle.blend( right, t );
      var mid = leftMid.blend( rightMid, t );
      return [
        new Segment.Cubic( this.start, left, leftMid, mid, skipComputations ),
        new Segment.Cubic( mid, rightMid, right, this.end, skipComputations )
      ];
    },
    
    offsetTo: function( r, reverse ) {
      // TODO: implement more accurate method at http://www.antigrain.com/research/adaptive_bezier/index.html
      // TODO: or more recently (and relevantly): http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf
      
      // how many segments to create (possibly make this more adaptive?)
      var quantity = 32;
      
      var points = [];
      var result = [];
      for ( var i = 0; i < quantity; i++ ) {
        var t = i / ( quantity - 1 );
        if ( reverse ) {
          t = 1 - t;
        }
        
        points.push( this.positionAt( t ).plus( this.tangentAt( t ).perpendicular().normalized().times( r ) ) );
        if ( i > 0 ) {
          result.push( new Segment.Line( points[i-1], points[i] ) );
        }
      }
      
      return result;
    },
    
    getSVGPathFragment: function() {
      return 'C ' + this.control1.x + ' ' + this.control1.y + ' ' + this.control2.x + ' ' + this.control2.y + ' ' + this.end.x + ' ' + this.end.y;
    },
    
    strokeLeft: function( lineWidth ) {
      return this.offsetTo( -lineWidth / 2, false );
    },
    
    strokeRight: function( lineWidth ) {
      return this.offsetTo( lineWidth / 2, true );
    },
    
    getInteriorExtremaTs: function() {
      var ts = this.xExtremaT.concat( this.yExtremaT );
      var result = [];
      _.each( ts, function( t ) {
        var epsilon = 0.0000000001; // TODO: general kite epsilon?
        if ( t > epsilon && t < 1 - epsilon ) {
          // don't add duplicate t values
          if ( _.every( result, function( otherT ) { return Math.abs( t - otherT ) > epsilon; } ) ) {
            result.push( t );
          }
        }
      } );
      return result.sort();
    },
    
    intersectsBounds: function( bounds ) {
      throw new Error( 'Segment.Cubic.intersectsBounds unimplemented' ); // TODO: implement
    },
    
    // returns the resultant winding number of this ray intersecting this segment.
    intersection: function( ray ) {
      var self = this;
      var result = [];
      
      // find the rotation that will put our ray in the direction of the x-axis so we can only solve for y=0 for intersections
      var inverseMatrix = Matrix3.rotation2( -ray.dir.angle() ).timesMatrix( Matrix3.translation( -ray.pos.x, -ray.pos.y ) );
      
      var p0 = inverseMatrix.timesVector2( this.start );
      var p1 = inverseMatrix.timesVector2( this.control1 );
      var p2 = inverseMatrix.timesVector2( this.control2 );
      var p3 = inverseMatrix.timesVector2( this.end );
      
      // polynomial form of cubic: start + (3 control1 - 3 start) t + (-6 control1 + 3 control2 + 3 start) t^2 + (3 control1 - 3 control2 + end - start) t^3
      var a = -p0.y + 3 * p1.y - 3 * p2.y + p3.y;
      var b = 3 * p0.y - 6 * p1.y + 3 * p2.y;
      var c = -3 * p0.y + 3 * p1.y;
      var d = p0.y;
      
      var ts = solveCubicRootsReal( a, b, c, d );
      
      _.each( ts, function( t ) {
        if ( t >= 0 && t <= 1 ) {
          var hitPoint = self.positionAt( t );
          var unitTangent = self.tangentAt( t ).normalized();
          var perp = unitTangent.perpendicular();
          var toHit = hitPoint.minus( ray.pos );
          
          // make sure it's not behind the ray
          if ( toHit.dot( ray.dir ) > 0 ) {
            result.push( {
              distance: toHit.magnitude(),
              point: hitPoint,
              normal: perp.dot( ray.dir ) > 0 ? perp.negated() : perp,
              wind: ray.dir.perpendicular().dot( unitTangent ) < 0 ? 1 : -1
            } );
          }
        }
      } );
      return result;
    },
    
    windingIntersection: function( ray ) {
      var wind = 0;
      var hits = this.intersection( ray );
      _.each( hits, function( hit ) {
        wind += hit.wind;
      } );
      return wind;
    },
    
    // assumes the current position is at start
    writeToContext: function( context ) {
      context.bezierCurveTo( this.control1.x, this.control1.y, this.control2.x, this.control2.y, this.end.x, this.end.y );
    },
    
    transformed: function( matrix ) {
      return new Segment.Cubic( matrix.timesVector2( this.start ), matrix.timesVector2( this.control1 ), matrix.timesVector2( this.control2 ), matrix.timesVector2( this.end ) );
    }
    
    // returns the resultant winding number of this ray intersecting this segment.
    // windingIntersection: function( ray ) {
    //   // find the rotation that will put our ray in the direction of the x-axis so we can only solve for y=0 for intersections
    //   var inverseMatrix = Matrix3.rotation2( -ray.dir.angle() );
    //   assert && assert( inverseMatrix.timesVector2( ray.dir ).x > 0.99 ); // verify that we transform the unit vector to the x-unit
      
    //   var y0 = inverseMatrix.timesVector2( this.start ).y;
    //   var y1 = inverseMatrix.timesVector2( this.control1 ).y;
    //   var y2 = inverseMatrix.timesVector2( this.control2 ).y;
    //   var y3 = inverseMatrix.timesVector2( this.end ).y;
      
    //   // polynomial form of cubic: start + (3 control1 - 3 start) t + (-6 control1 + 3 control2 + 3 start) t^2 + (3 control1 - 3 control2 + end - start) t^3
    //   var a = -y0 + 3 * y1 - 3 * y2 + y3;
    //   var b = 3 * y0 - 6 * y1 + 3 * y2;
    //   var c = -3 * y0 + 3 * y1;
    //   var d = y0;
      
    //   // solve cubic roots
    //   var ts = solveCubicRootsReal( a, b, c, d );
      
    //   var result = 0;
      
    //   // for each hit
    //   _.each( ts, function( t ) {
    //     if ( t >= 0 && t <= 1 ) {
    //       result += ray.dir.perpendicular().dot( this.tangentAt( t ) ) < 0 ? 1 : -1;
    //     }
    //   } );
      
    //   return result;
    // }
  } );
  
  return Segment.Cubic;
} );
