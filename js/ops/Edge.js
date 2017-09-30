// Copyright 2017, University of Colorado Boulder

/**
 * Represents a segment in the graph (connects to vertices on both ends)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( function( require ) {
  'use strict';

  var HalfEdge = require( 'KITE/ops/HalfEdge' );
  var inherit = require( 'PHET_CORE/inherit' );
  var kite = require( 'KITE/kite' );
  var Poolable = require( 'PHET_CORE/Poolable' );
  var Segment = require( 'KITE/segments/Segment' );
  var Vertex = require( 'KITE/ops/Vertex' );

  // TODO: Common ops place?
  var vertexEpsilon = 1e-5;

  var globaId = 0;

  /**
   * @public (kite-internal)
   * @constructor
   *
   * @param {Segment} segment
   * @param {Vertex} startVertex
   * @param {Vertex} endVertex
   */
  function Edge( segment, startVertex, endVertex ) {
    // @public {number}
    this.id = ++globaId;

    this.initialize( segment, startVertex, endVertex );
  }

  kite.register( 'Edge', Edge );

  inherit( Object, Edge, {
    initialize: function( segment, startVertex, endVertex ) {
      assert && assert( segment instanceof Segment );
      assert && assert( startVertex instanceof Vertex );
      assert && assert( endVertex instanceof Vertex );
      assert && assert( segment.start.distance( startVertex.point ) < vertexEpsilon );
      assert && assert( segment.end.distance( endVertex.point ) < vertexEpsilon );

      // @public {Segment|null} - Null when disposed (in pool)
      this.segment = segment;

      // @public {Vertex|null} - Null when disposed (in pool)
      this.startVertex = startVertex;
      this.endVertex = endVertex;

      // @public {number}
      this.signedAreaFragment = segment.getSignedAreaFragment();

      // @public {HalfEdge|null} - Null when disposed (in pool)
      this.forwardHalf = HalfEdge.createFromPool( this, false );
      this.reversedHalf = HalfEdge.createFromPool( this, true );

      return this;
    },

    dispose: function() {
      this.segment = null;
      this.startVertex = null;
      this.endVertex = null;

      this.forwardHalf.dispose();
      this.reversedHalf.dispose();

      this.forwardHalf = null;
      this.reversedHalf = null;

      this.freeToPool();
    },

    getOtherVertex: function( vertex ) {
      assert && assert( vertex === this.startVertex || vertex === this.endVertex );

      return this.startVertex === vertex ? this.endVertex : this.startVertex;
    },

    /**
     * Update possibly reversed vertex references.
     * @public
     */
    updateReferences: function() {
      this.forwardHalf.updateReferences();
      this.reversedHalf.updateReferences();
    }
  } );

  Poolable.mixin( Edge, {
    constructorDuplicateFactory: function( pool ) {
      return function( segment, startVertex, endVertex ) {
        if ( pool.length ) {
          return pool.pop().initialize( segment, startVertex, endVertex );
        }
        else {
          return new Edge( segment, startVertex, endVertex );
        }
      };
    }
  } );

  return kite.Edge;
} );
