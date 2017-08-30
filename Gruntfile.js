module.exports = function (grunt) {
    grunt.initConfig({
        rev: {
            options: {
                encoding: 'utf8',
                algorithm: 'md5',
                length: 8
            },
            assets: {
                src: [
                    'public/javascripts/**/*.js',
                    'public/stylesheets/**/*.css',
                ]
            }
        },
        usemin: {
            css: {
                files: {
                    src: ['public/stylesheets/**/*.css']
                }
            },
            js: ['public/javascripts/**/*.js'],
            html: ['views/**/*.ejs'],
            options: {
                assetsDirs: ['static', 'public/'],
                patterns: {
                    js: [[/(\/public\/images\/[\/\w-]+\.jpg)/, 'replace image in js']]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-rev');
    grunt.loadNpmTasks('grunt-contrib-levin-usemin');

    grunt.registerTask('default', ['rev', 'usemin']);
};