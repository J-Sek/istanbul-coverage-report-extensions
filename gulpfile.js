let gulp = require('gulp');
let $ = require('gulp-load-plugins')();
let st = require('st');
let http = require('http');
let open = require('open');

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
        // .pipe(/* TODO */)
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
    gulp.watch(SCRIPTS_PATH,    ['build:scripts']);
    gulp.watch(STYLES_PATH,     ['build:styles']);
}));

gulp.task('open', gulp.series('server', () =>
    open(`http://localhost:${port}`)
));