module.exports = function(grunt) {
	'use strict';

	// Project configuration.
	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),

		clean:['coverage', 'dist'],

		jshint: {
			options: {
				jshintrc: '.jshintrc',
				reporter: require('jshint-stylish')
			},
			all: ['Gruntfile.js', 'lib/**/*.js']
		},

		mocha_istanbul: {
	        test: {
	            src: 'test/**/*.js', // a folder works nicely
	            options: {
	                mask: '*Test.js',
	                coverage: true,
	                check: {
	                	branches: 0,
	                	functions: 0,
	                	lines: 0,
	                	statements: 0,
	                },
	                // html - produces a bunch of HTML files with annotated source code
	                // lcovonly - produces an lcov.info file
	                // lcov - produces html + lcov files. This is the default format
	                // cobertura - produces a cobertura-coverage.xml file for easy Hudson integration
	                // text-summary - produces a compact text summary of coverage, typically to console
	                // text - produces a detailed text table with coverage for all files
	                // teamcity - produces service messages to report code coverage to TeamCity
	                reportFormats: ['html','lcovonly'],
	            }
	        },
		},

		shell: {
			'assert-none-dirty-status': {
				command: 'git add --all --dry-run',
				options: {
					callback: function(err, stdout, stderr, callback){
						if ( stdout !== '' ) {
							grunt.fail.fatal(new Error(
								'\nYou have on-going changes. Please commit the following before releasing:\n* ' +
								stdout.split('\n').join('\n* ').replace(/\* $/, '').replace(/add /g, '')
							));
						}
						callback();
					}
				},
			},
		},

		release: {
			options: {
				bump: true,
				changelog: false, 
//				changelogText: '### <%= version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' 
				file: 'package.json',
				additionalFiles: [],
				add: true, 
				commit: true, 
				tag: true, 
				push: true, 
				pushTags: true, 
				npm: true, 
//				npmtag: '<%= version %>', 
				indentation: '  ', 
//				folder: 'folder/to/publish/to/npm',	//default project root 
				tagName: '<%= version %>', 
				commitMessage: '[admin] release <%= version %>', 
				tagMessage: '[admin] version <%= version %>', 
//				beforeBump: [],						// optional grunt tasks to run before file versions are bumped 
				afterBump: [],						// optional grunt tasks to run after file versions are bumped 
				beforeRelease: [],					// optional grunt tasks to run after release version is bumped up but before release is packaged 
				afterRelease: [],					// optional grunt tasks to run after release is packaged 
//				updateVars: ['pkg'],				// optional grunt config objects to update (this will update/set the version property on the object specified) 
//				github: {
//					apiRoot: 'https://git.example.com/v3', // Default: https://github.com 
//					repo: 'geddski/grunt-release',	//put your user/repo here 
//					accessTokenVar: 'GITHUB_ACCESS_TOKE', //ENVIRONMENT VARIABLE that contains GitHub Access Token 
//					 
//					// Or you can use username and password env variables, we discourage you to do so 
//					usernameVar: 'GITHUB_USERNAME',	//ENVIRONMENT VARIABLE that contains GitHub username 
//					passwordVar: 'GITHUB_PASSWORD'	//ENVIRONMENT VARIABLE that contains GitHub password 
//				},
			},
		},
	});

	// Load the plugins.
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-mocha-istanbul');
	grunt.loadNpmTasks('grunt-release');
	grunt.loadNpmTasks('grunt-shell');

	// Default task(s).
	grunt.registerTask('build', ['clean', 'jshint']);
	grunt.registerTask('test', ['build', 'mocha_istanbul']);
	grunt.registerTask('default', ['test']);
	grunt.registerTask('safe-release', ['shell:assert-none-dirty-status', 'release']);
	grunt.registerTask('safe-prerelease', ['shell:assert-none-dirty-status', 'release:prerelease']);
};
