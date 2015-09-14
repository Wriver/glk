module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({

        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
            options: {
                globals: {
                    jQuery: true
                }
            }
        },

        jasmine: {
            /*
                With my current configuration or some other reasons. The browserified target
                hide everything, so nothing exposed to Jasmine. So, require the module directly
                in Spec, and make this as null
             */
            src: 'build/release/null.js',
            options: {
                specs: 'build/test/*.js'
            }
        },

        browserify: {
            main: {
                src: 'src/main.js',
                dest: 'build/release/main.js'
            },
            test: {
                src: 'spec/spec_glk.js',
                dest: 'build/test/test_glk.js'
            },
            options: {
                browserifyOptions: {
                    debug: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-browserify');

    grunt.registerTask('test', ['jshint','browserify','jasmine']);
    grunt.registerTask('default', ['jshint','browserify:main']);
};