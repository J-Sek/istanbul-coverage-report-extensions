let gulp = require('gulp');
let $ = require('gulp-load-plugins')();
let st = require('st');
let http = require('http');
let open = require('open');
let {shell} = require('execa');

let coverageHacks = require('./coverageHacks');

const DEST_DIR = 'dest';
const SCRIPTS_PATH = 'src/**/*.ts';
const STYLES_PATH = 'src/**/*.scss';
const ASSETS_DIR = DEST_DIR + '/assets';

gulp.task('build:scripts', () =>
    gulp.src(SCRIPTS_PATH)
        .pipe($.typescript({
            module: 'amd',
            removeComments: true,
            target: 'ES6'
        }))
        .pipe(gulp.dest(ASSETS_DIR))
        .pipe($.livereload())
);

gulp.task('build:styles', () =>
    gulp.src(STYLES_PATH)
        .pipe($.postcss([
            require('precss')({import: {extension: 'scss'}})
        ]))
        .pipe($.rename((x) => { x.extname = '.css' }))
        .pipe(gulp.dest(ASSETS_DIR))
        .pipe($.livereload())
);

gulp.task('apply:injection', () =>
    gulp.src([
            'coverage/**/*.html'
        ])
        .pipe(coverageHacks({
            baseDir: DEST_DIR,
            styles: `${ASSETS_DIR}/**/*.css`,
            scripts: [
                'https://code.jquery.com/jquery-3.1.0.min.js',
                `${ASSETS_DIR}/**/*.js`
            ]
        }))
        .pipe(gulp.dest(DEST_DIR))
);

gulp.task('copy:other', () =>
    gulp.src([
            'coverage/base.css',
            'coverage/prettify.css',
            'coverage/prettify.js',
            'coverage/sorter.js',
            'coverage/sort-arrow-sprite.png',
        ])
        .pipe(gulp.dest(DEST_DIR))
);

gulp.task('build', gulp.parallel(
    'build:styles',
    'build:scripts',
    'apply:injection',
    'copy:other'
));

let port = process.env.PORT || 8082;

gulp.task('server', gulp.series('build', (done) => {
    console.log(`Server ready for requests: http://localhost:${port}/`);
    http.createServer(st({
            path  : `${__dirname}/${DEST_DIR}`,
            index : 'index.html',
            cache : false
        }))
        .listen(port, done);
}));

gulp.task('watch', gulp.series('server', () => {
    $.livereload.listen({basePath: DEST_DIR});
    gulp.watch(SCRIPTS_PATH,    gulp.series('build:scripts'));
    gulp.watch(STYLES_PATH,     gulp.series('build:styles'));
}));

gulp.task('open', gulp.series('server', () =>
    open(`http://localhost:${port}`)
));

gulp.task('hotel:init', () =>
    shell('hotel add "gulp watch"')
);