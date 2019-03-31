module.exports = function(gulp, config, plugins) {
	'use strict';

	gulp.task('clean', function() {
		if (
			config.environment === 'src' ||
			config.environment === 'dev'
		) {
			return;
		}

		var paths = config[config.environment];
		return plugins.del(paths.base + '**');
	});
};
