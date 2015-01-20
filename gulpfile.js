var gulp = require('gulp');
var _ = require('lodash');
var Promise = require('bluebird');
var fs = require('fs');
var mkdirp = require('mkdirp');
var minimist = require('minimist');
var path = require('path');

Promise.promisifyAll(mkdirp);
Promise.promisifyAll(fs);

var options = minimist(process.argv.slice(2)),
    trgPath = options.f;
    prompt = typeof options.p === 'string' ? options.p.split(' ') : null;

var BEM_INFO = function(){
    var info = {};

    info.stat = fs.statSync(trgPath);
    info.type = getTargetTypeByStat(info.stat);
    info.isDir = info.stat.isDirectory();
    info.isFile = info.stat.isFile();
    info.dirName = getDirName(info);
    info.isBlock = isBlock(info);
    info.isElem = isElem(info);
    info.isMod = isMod(info);
    info.blockName = getBlockName(null, info);
    info.elemName = getElemName(info);
    info.modName = getModName(info);
    info.bemName = getBemName(info);

    return info;
}();

var SUFFIXES = {
    css: '.css',
    c: '.css',
    js: '.js',
    j: '.js',
    deps: '.deps.js',
    d: '.deps.js',
    bh: '.bh.js',
    b: '.bh.js',
    priv: '.priv.js',
    p: '.priv.js'
};

var DEFAULT_ACTIONS = {
        blockDir: startCreating.bind(null, ['css']),
        depsFile: createElemDirsByDeps,
        elemDir: startCreating.bind(null, ['css']),
        modDir: startCreating.bind(null, ['css'])
    },
    FILE_TEMPLATES = {
        js: 'js-template.js',
        j: 'js-template.js',
        css: 'css-template.css',
        c: 'css-template.css',
        bh: 'bh-template.js',
        b: 'bh-template.js',
        deps: 'deps-template.js',
        d: 'deps-template.js',
        priv: 'priv-template.js',
        p: 'priv-template.js'
    };

gulp.task('default', function(){
    chooseActionByDefault();
});

gulp.task('create', function(){
    startCreating(prompt);
});

function createElemDirsByDeps(){
    fs.readFileAsync(trgPath, 'utf-8')
        .then(depsToObj)
        .then(getElemsListFromDepsObj)
        .map(createElemsDirs);
}

function getBemName(info){
    return info.blockName + info.elemName + info.modName;
}

function getDirName(info){
    if (info && info.isDir) {
        return getDirNameByPath(trgPath);
    }
}

function isBlock(info){
    if (info && info.isFile) return;

    var isBlock = /\/[^_][-a-z0-9]+$/i.test(trgPath);
    return isBlock || false;
}

function isElem(info){
    if (info && info.isFile) return;
    return /__[-a-z0-9]+$/ig.test(trgPath);
}

function isMod(info){
    if (info && info.isFile) return;

    return /\/_[-a-z0-9]+$/ig.test(trgPath);
}

function getBlockName(targetPath, info){
    targetPath = targetPath || trgPath;

    if (info && info.isBlock) return targetPath.match(/[-a-z0-9]+$/i)[0];

    var dirName = path.dirname(targetPath),
    baseName = path.basename(dirName);

    if (/_/g.test(baseName)) {
        return getBlockName(path.resolve(targetPath, '../'));
    } else {
        return baseName;
    }
}

function getElemName(info){
    if (info.isElem) return info.dirName;
    if (info.isMod) {
        var parentDir = path.basename(path.resolve(trgPath, '../')),
            parentIsElem = /^(__)/ig.test(parentDir);
        if (parentIsElem) return parentDir;
    }

    return '';
}

function getModName(info){
    if (info.isMod) return info.dirName;
    return '';
}

function startCreating(fileTypes){
    return fileTypes.forEach(function(fileType){
        return createFileFromTemplate(fileType);
    });
}

function createFileFromTemplate(fileType){
    var tmp = FILE_TEMPLATES[fileType],
        file = insertName(getTemplate(tmp));

    createFile(file, fileType);
}

function insertName(file){
    return file
        .replace(/{{blockName}}/g, BEM_INFO.blockName)
        .replace(/{{elemName}}/g, BEM_INFO.elemName)
        .replace(/{{modName}}/g, BEM_INFO.modName);
}

function getTargetTypeByStat(stat){
    if (stat.isFile()) {
        return detectFileType(trgPath);
    } else if (stat.isDirectory()) {
        return detectDirType(trgPath);
    }
}

function detectFileType(targetFile) {
    var filename = path.basename(targetFile),
        fileType;

    switch (true) {
        case /\.deps\./.test(filename):
            fileType = 'depsFile';
            break;
    }

    return fileType;
}

function detectDirType(targetDir){
    var dirName = path.basename(targetDir),
        dirType;

    switch (true) {
        case /^__/.test(dirName):
            dirType = 'elemDir';
            break;
        case /^_/.test(dirName):
            dirType = 'modDir';
            break;

        default:
            dirType = 'blockDir';
    }

    return dirType;
}

function chooseActionByDefault(){
    DEFAULT_ACTIONS[BEM_INFO.type]();
}

function depsToObj(data){
    return (0, eval(data));
}

function getElemsListFromDepsObj(data) {
    var mustElems = getElemsFormDeps(data.mustDeps),
        shouldElems = getElemsFormDeps(data.shouldDeps);

    return mustElems.concat(shouldElems);
}

function getElemsFormDeps(deps) {
    if (!deps) return [];

    //todo Подумать, как сделать лучше
    var elemsObj = _.find(deps, 'elems'),
        singleElems = [],
        resultElemList = [];

    deps.forEach(function(item){
        if (item['elem'] && !item['block']) singleElems.push(item['elem']);
    });

    if (elemsObj) {
        resultElemList = singleElems.concat(elemsObj['elems']);
    } else {
        resultElemList = singleElems;
    }

    return resultElemList;
}

function createElemsDirs(elemName){
    var blockDir = path.dirname(trgPath);
    return mkdirp.mkdirpAsync(blockDir + '/__' + elemName);
}

function createFile(file, type, path){
    path = (path || trgPath) + '/' + BEM_INFO.bemName + SUFFIXES[type];
    fs.writeFileSync(path, file);
}

function getTemplate(tmpName){
    return fs.readFileSync('tmp/' + tmpName, 'utf-8');
}

function getDirNameByPath(path){
    return path.match(/[-a-z0-9_]+$/ig)[0];
}