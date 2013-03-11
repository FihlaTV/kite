/*global module:false*/
module.exports = function( grunt ) {
  
  // print this immediately, so it is clear what project grunt is building
  grunt.log.writeln( 'Kite' );
  
  // Project configuration.
  grunt.initConfig( {
    pkg: '<json:package.json>',
    
    requirejs: {
      // unminified, with has.js
      development: {
        options: {
          almond: true,
          mainConfigFile: "js/config.js",
          out: "dist/development/kite.js",
          name: "config",
          optimize: 'none',
          wrap: {
            startFile: [ "js/wrap-start.frag", "contrib/has.js" ],
            endFile: [ "js/wrap-end.frag" ]
          }
        }
      },
      
      // with has.js
      standalone: {
        options: {
          almond: true,
          mainConfigFile: "js/production-config.js",
          out: "dist/standalone/kite.min.js",
          name: "production-config",
          optimize: 'uglify2',
          generateSourceMaps: true,
          preserveLicenseComments: false,
          wrap: {
            startFile: [ "js/wrap-start.frag", "contrib/has.js" ],
            endFile: [ "js/wrap-end.frag" ]
          }
        }
      },
      
      // without has.js
      production: {
        options: {
          almond: true,
          mainConfigFile: "js/production-config.js",
          out: "dist/production/kite.min.js",
          name: "production-config",
          optimize: 'uglify2',
          generateSourceMaps: true,
          preserveLicenseComments: false,
          wrap: {
            startFile: [ "js/wrap-start.frag" ],
            endFile: [ "js/wrap-end.frag" ]
          }
        }
      }
    },
    
    jshint: {
      all: [
        'Gruntfile.js', 'js/**/*.js', 'common/dot/js/**/*.js', 'common/assert/js/**/*.js'
      ],
      // adjust with options from http://www.jshint.com/docs/
      options: {
        // enforcing options
        curly: true, // brackets for conditionals
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        // noempty: true,
        nonew: true,
        // quotmark: 'single',
        undef: true,
        // unused: true, // certain layer APIs not used in cases
        // strict: true,
        trailing: true,
        
        expr: true, // so we can use assert && assert( ... )
        
        // relaxing options
        es5: true, // we use ES5 getters and setters for now
        loopfunc: true, // we know how not to shoot ourselves in the foot, and this is useful for _.each
        
        globals: {
          // for require.js
          define: true,
          require: true,
          
          _: false,
          
          Uint16Array: false,
          Uint32Array: false,
          document: false,
          window: false,
          console: false,
          Float32Array: true // we actually polyfill this, so allow it to be set
        }
      },
    }
  } );
  
  // Default task.
  grunt.registerTask( 'default', [ 'jshint', 'development', 'standalone', 'production' ] );
  grunt.registerTask( 'production', [ 'requirejs:production' ] );
  grunt.registerTask( 'standalone', [ 'requirejs:standalone' ] );
  grunt.registerTask( 'development', [ 'requirejs:development' ] );
  grunt.loadNpmTasks( 'grunt-requirejs' );
  grunt.loadNpmTasks( 'grunt-contrib-concat' );
  grunt.loadNpmTasks( 'grunt-contrib-uglify' );
  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
};
