// Copyright 2013-2019, University of Colorado Boulder

/**
 * Module that includes all Kite dependencies, so that requiring this module will return an object
 * that consists of the entire exported 'kite' namespace API.
 *
 * The API is actually generated by the 'kite' module, so if this module (or all other modules) are
 * not included, the 'kite' namespace may not be complete.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( [
  'KITE/kite',

  'KITE/Shape',
  'KITE/ops/Boundary',
  'KITE/ops/BoundsIntersection',
  'KITE/ops/Edge',
  'KITE/ops/Face',
  'KITE/ops/Graph',
  'KITE/ops/HalfEdge',
  'KITE/ops/Loop',
  'KITE/ops/Vertex',
  'KITE/segments/Arc',
  'KITE/segments/Cubic',
  'KITE/segments/EllipticalArc',
  'KITE/segments/Line',
  'KITE/segments/Quadratic',
  'KITE/segments/Segment',
  'KITE/util/LineStyles',
  'KITE/util/Overlap',
  'KITE/util/SegmentIntersection',
  'KITE/util/Subpath',

  'KITE/parser/svgPath'

  // note: the kite variable is filled in as modules are visited
], function( kite ) {
  'use strict';

  return kite;
} );
