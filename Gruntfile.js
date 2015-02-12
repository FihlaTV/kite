/*global module:false*/
module.exports = function( grunt ) {
  'use strict';

  // print this immediately, so it is clear what project grunt is building
  grunt.log.writeln( 'Kite' );

  // Project configuration.
  grunt.initConfig( {
    pkg: '<json:package.json>',

    requirejs: {
      // unminified
      development: {
        options: {
          almond: true,
          mainConfigFile: "js/config.js",
          out: "build/development/kite.js",
          name: "config",
          optimize: 'none',
          wrap: {
            startFile: [ "js/wrap-start.frag", "../assert/js/assert.js" ],
            endFile: [ "js/wrap-end.frag" ]
          }
        }
      },

      production: {
        options: {
          almond: true,
          mainConfigFile: "js/config.js",
          out: "build/production/kite.min.js",
          name: "config",
          optimize: 'uglify2',
          generateSourceMaps: true,
          preserveLicenseComments: false,
          wrap: {
            startFile: [ "js/wrap-start.frag", "../assert/js/assert.js" ],
            endFile: [ "js/wrap-end.frag" ]
          },
          uglify2: {
            compress: {
              global_defs: {
                assert: false,
                assertSlow: false,
                phetAllocation: false
              },
              dead_code: true
            }
          }
        }
      }
    },

    jshint: {
      all: [
        'Gruntfile.js', 'js/**/*.js', '../dot/js/**/*.js', '../phet-core/js/**/*.js', '../assert/js/**/*.js', '!js/parser/svgPath.js'
      ],
      kite: [
        'js/**/*.js',
        '!js/parser/svgPath.js'
      ],
      // reference external JSHint options in jshintOptions.js
      options: require( '../chipper/js/grunt/jshintOptions' )
    }
  } );

  // Default task.
  grunt.registerTask( 'default', [ 'jshint:all', 'development', 'production' ] );

  // linter on kite subset only ('grunt lint')
  grunt.registerTask( 'lint', [ 'jshint:kite' ] );

  grunt.registerTask( 'production', [ 'requirejs:production' ] );
  grunt.registerTask( 'development', [ 'requirejs:development' ] );
  grunt.loadNpmTasks( 'grunt-requirejs' );
  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
};
