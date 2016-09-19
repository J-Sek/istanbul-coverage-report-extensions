let fs = require('fs');
let File = require('vinyl');
let glob = require('glob-promise');
let {obj} = require('through2');
let {relative, parse} = require('path');
let {PluginError} = require('gulp-util');

let _error = (msg) => new PluginError('coverage-hacks', msg);
let asArray = (x) => x instanceof Array ? x : [x];
let globify = (x) => /^http/.test(x) ? Promise.resolve([x]) : glob(x);
let makeRelative = (base, path) => /^http/.test(path) ? path : relative(base, path);
let splitPaths = (globs) =>
    globs 
        ? Promise.all(asArray(globs).map(globify))
            .then((...pathGroups) => pathGroups
                    .reduce(((acc, x) => acc.concat(x)), [])
                    .reduce(((acc, x) => acc.concat(x)), []))
        : Promise.resolve();

class Options {
    constructor(args) {
        this.groups = Array.isArray(args)
            ? args.map(this.getOptions)
            : [this.getOptions(args)];
     
        if (this.groups.filter(o => !o.styles && !o.scripts).length > 0) {
            throw _error('Current configuration is invalid. Please specify assets to inject.');
        }
    }

    getOptions(args) {
        return {
            baseDir: args.baseDir || __dirname,
            styles: args.styles,
            scripts: args.scripts,
            pattern: args.pattern instanceof RegExp ? args.pattern : null
        }
    }
}

let toLinkTags = (paths) => paths.map(x => `<link rel="stylesheet" href="${x}" />`).join('');
let toScriptTags = (paths) => paths.map(x => `<script src="${x}"></script>`).join('');

let applyReplacements = (file, options, verbose) => {
    const HEAD_END = '</head>';
    const BODY_END = '</body>';
    let currentBaseDir = options.baseDir + '/' + parse(file.relative).dir;
    
    if (verbose) {
        console.log(`Processing ${relative(__dirname, file.path)}\n .. paths will be resolved for ${currentBaseDir}`);
    }

    return Promise.all([
        options.styles ? splitPaths(options.styles) : Promise.resolve([]),
        options.scripts ? splitPaths(options.scripts) : Promise.resolve([])
    ])
    .then(([stylesPaths, scriptsPaths]) => {
        stylesPaths = stylesPaths.map(p => makeRelative(currentBaseDir, p).replace(/\\/g, '/'));
        scriptsPaths = scriptsPaths.map(p => makeRelative(currentBaseDir, p).replace(/\\/g, '/'));
        
        if (verbose) {
            console.log(` .. updating contents of ${relative(__dirname, file.path)}`);
            console.log(stylesPaths.map(x => ` .. + ${x}`).join('\n'));
            console.log(scriptsPaths.map(x => ` .. + ${x}`).join('\n'));
        }
        
        file.contents = new Buffer(String(file.contents)
            .replace(HEAD_END, `${toLinkTags(stylesPaths)}\n${HEAD_END}`)
            .replace(BODY_END, `${toScriptTags(scriptsPaths)}\n${BODY_END}`)
        );
    })
    .catch(err => _error(err));
}

module.exports = (args) => {
    let options = new Options(args);
    let verbose = args.verbose || false;

    return obj(function (file, enc, cb) {

        let next = () => {
            cb(null, file);
        };

        return Promise.all(
            options.groups.map(groupOptions =>
                (!groupOptions.pattern || groupOptions.pattern.test(file.path))
                    ? applyReplacements(file, groupOptions, verbose)
                    : Promise.resolve()
            )
        )
        .then(next)
        .catch(err => _error(err));
    });
};
